use reqwest::multipart;
use std::time::Duration;
use tokio::time::sleep;
use uuid::Uuid;

use crate::{
    common::types::ChatId, errors::PentaractResult,
    services::storage_workers_scheduler::StorageWorkersScheduler,
};

use super::schemas::{DownloadBodySchema, UploadBodySchema, UploadSchema};

pub struct TelegramBotApi<'t> {
    base_url: &'t str,
    scheduler: StorageWorkersScheduler<'t>,
    client: &'t reqwest::Client,
}

impl<'t> TelegramBotApi<'t> {
    pub fn new(
        base_url: &'t str,
        scheduler: StorageWorkersScheduler<'t>,
        client: &'t reqwest::Client,
    ) -> Self {
        Self {
            base_url,
            scheduler,
            client,
        }
    }

    pub async fn upload(
        &self,
        file: &[u8],
        chat_id: ChatId,
        storage_id: Uuid,
    ) -> PentaractResult<UploadSchema> {
        let chat_id = {
            // inserting 100 between minus sign and chat id
            // cause telegram devs are complete retards and it works this way only
            //
            // https://stackoverflow.com/a/65965402/12255756

            let n = chat_id.abs().checked_ilog10().unwrap_or(0) + 1;
            chat_id - (100 * ChatId::from(10).pow(n))
        };

        // Retry logic with exponential backoff for 429 errors
        const MAX_RETRIES: u32 = 3;
        let mut last_error = None;

        for attempt in 0..=MAX_RETRIES {
            if attempt > 0 {
                // Exponential backoff: 1s, 2s, 4s
                let wait_secs = 2u64.pow(attempt - 1);
                tracing::debug!("[TELEGRAM API] Rate limited, retrying in {} seconds (attempt {}/{})", wait_secs, attempt, MAX_RETRIES);
                sleep(Duration::from_secs(wait_secs)).await;
            }

            let token = self.scheduler.get_token(storage_id).await?;
            let url = self.build_url("", "sendDocument", token);

            let file_part = multipart::Part::bytes(file.to_vec()).file_name("pentaract_chunk.bin");
            let form = multipart::Form::new()
                .text("chat_id", chat_id.to_string())
                .part("document", file_part);

            let response = self
                .client
                .post(url)
                .multipart(form)
                .send()
                .await?;

            let status = response.status();
            
            // If rate limited (429), retry
            if status.as_u16() == 429 {
                last_error = Some(format!("[Telegram API] 429 Too Many Requests"));
                continue;
            }

            // For other errors or success, handle normally
            match response.error_for_status() {
                Ok(r) => return Ok(r.json::<UploadBodySchema>().await?.result.document),
                Err(e) => return Err(e.into()),
            }
        }

        // All retries exhausted
        Err(crate::errors::PentaractError::TelegramAPIError(
            last_error.unwrap_or_else(|| "Max retries exceeded".to_string())
        ))
    }

    pub async fn download(
        &self,
        telegram_file_id: &str,
        storage_id: Uuid,
    ) -> PentaractResult<Vec<u8>> {
        const MAX_RETRIES: u32 = 3;
        let mut last_error = None;

        for attempt in 0..=MAX_RETRIES {
            if attempt > 0 {
                let wait_secs = 2u64.pow(attempt - 1);
                tracing::debug!("[TELEGRAM API] Download rate limited, retrying in {} seconds (attempt {}/{})", wait_secs, attempt, MAX_RETRIES);
                sleep(Duration::from_secs(wait_secs)).await;
            }

            // 1. Get token once per chunk
            let token = self.scheduler.get_token(storage_id).await?;

            // 2. Getting file path
            let get_file_url = self.build_url("", "getFile", token.clone());
            let response = self
                .client
                .get(get_file_url)
                .query(&[("file_id", telegram_file_id)])
                .send()
                .await?;

            if response.status().as_u16() == 429 {
                last_error = Some("429 Too Many Requests on getFile".to_string());
                continue;
            }

            let body: DownloadBodySchema = match response.error_for_status() {
                Ok(r) => r.json().await?,
                Err(e) => return Err(e.into()),
            };

            // 3. Downloading the file itself using the SAME token
            let file_url = self.build_url("file/", &body.result.file_path, token);
            let file_response = self.client.get(file_url).send().await?;

            if file_response.status().as_u16() == 429 {
                last_error = Some("429 Too Many Requests on file download".to_string());
                continue;
            }

            let file_data = match file_response.error_for_status() {
                Ok(r) => r.bytes().await.map(|b| b.to_vec())?,
                Err(e) => return Err(e.into()),
            };

            return Ok(file_data);
        }

        Err(crate::errors::PentaractError::TelegramAPIError(
            last_error.unwrap_or_else(|| "Max retries exceeded during download".to_string()),
        ))
    }

    /// Taking token by a value to force dropping it so it can be used only once
    #[inline]
    fn build_url(&self, pre: &str, relative: &str, token: String) -> String {
        format!("{}/{pre}bot{token}/{relative}", self.base_url)
    }
}
