use futures::future::join_all;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    common::{
        channels::{DownloadFileData, UploadFileData},
        telegram_api::bot_api::TelegramBotApi,
        types::ChatId,
    },
    errors::PentaractResult,
    models::file_chunks::FileChunk,
    repositories::{files::FilesRepository, storages::StoragesRepository},
    schemas::files::DownloadedChunkSchema,
};

use super::storage_workers_scheduler::StorageWorkersScheduler;

pub struct StorageManagerService<'d> {
    storages_repo: StoragesRepository<'d>,
    files_repo: FilesRepository<'d>,
    telegram_baseurl: &'d str,
    db: &'d PgPool,
    chunk_size: usize,
    rate_limit: u8,
    client: &'d reqwest::Client,
}

impl<'d> StorageManagerService<'d> {
    pub fn new(
        db: &'d PgPool,
        telegram_baseurl: &'d str,
        rate_limit: u8,
        client: &'d reqwest::Client,
    ) -> Self {
        let files_repo = FilesRepository::new(db);
        let storages_repo = StoragesRepository::new(db);
        let chunk_size = 20 * 1024 * 1024;
        Self {
            storages_repo,
            files_repo,
            chunk_size,
            telegram_baseurl,
            db,
            rate_limit,
            client,
        }
    }

    pub async fn upload(&self, data: UploadFileData) -> PentaractResult<()> {
        use std::sync::Arc;
        use tokio::sync::Semaphore;

        // 1. getting storage
        let storage = self.storages_repo.get_by_file_id(data.file_id).await?;

        // 2. dividing file into chunks
        let bytes_chunks: Vec<_> = data.file_data.chunks(self.chunk_size).collect();

        // 3. uploading chunks concurrently respecting rate limits
        let semaphore = Arc::new(Semaphore::new(self.rate_limit as usize));
        let mut futures = Vec::with_capacity(bytes_chunks.len());

        for (position, bytes_chunk) in bytes_chunks.into_iter().enumerate() {
            let sem = semaphore.clone();
            let storage_id = storage.id;
            let chat_id = storage.chat_id;
            let file_id = data.file_id;
            let bytes_chunk = bytes_chunk.to_vec();

            futures.push(async move {
                let _permit = sem.acquire().await.map_err(|_| crate::errors::PentaractError::Unknown)?;
                self.upload_chunk(
                    storage_id,
                    chat_id,
                    file_id,
                    position,
                    &bytes_chunk,
                ).await
            });
        }

        let chunks = join_all(futures)
            .await
            .into_iter()
            .collect::<PentaractResult<Vec<_>>>()?;

        // 4. saving chunks to db
        self.files_repo.create_chunks_batch(chunks).await
    }

    async fn upload_chunk(
        &self,
        storage_id: Uuid,
        chat_id: ChatId,
        file_id: Uuid,
        position: usize,
        bytes_chunk: &[u8],
    ) -> PentaractResult<FileChunk> {
        let scheduler = StorageWorkersScheduler::new(self.db, self.rate_limit);

        let document = TelegramBotApi::new(self.telegram_baseurl, scheduler, self.client)
            .upload(bytes_chunk, chat_id, storage_id)
            .await?;

        tracing::debug!(
            "[TELEGRAM API] uploaded chunk with file_id \"{}\" and position \"{}\"",
            document.file_id,
            position
        );

        let chunk = FileChunk::new(Uuid::new_v4(), file_id, document.file_id, position as i16);
        Ok(chunk)
    }

    pub async fn download(&self, data: DownloadFileData) -> PentaractResult<Vec<u8>> {
        use std::sync::Arc;
        use tokio::sync::Semaphore;

        // 1. getting chunks
        let chunks_models = self.files_repo.list_chunks_of_file(data.file_id).await?;

        // 2. downloading by chunks concurrently respecting rate limits
        let semaphore = Arc::new(Semaphore::new(self.rate_limit as usize));
        let mut futures = Vec::with_capacity(chunks_models.len());

        for chunk_model in chunks_models {
            let sem = semaphore.clone();
            let storage_id = data.storage_id;

            futures.push(async move {
                let _permit = sem.acquire().await.map_err(|_| crate::errors::PentaractError::Unknown)?;
                self.download_chunk(storage_id, chunk_model).await
            });
        }

        let mut chunks = join_all(futures)
            .await
            .into_iter()
            .collect::<PentaractResult<Vec<_>>>()?;

        // 3. sorting in a right positions and merging into single bytes slice
        chunks.sort_by_key(|chunk| chunk.position);
        let file = chunks.into_iter().flat_map(|chunk| chunk.data).collect();
        Ok(file)
    }

    async fn download_chunk(
        &self,
        storage_id: Uuid,
        chunk: crate::models::file_chunks::FileChunk,
    ) -> PentaractResult<DownloadedChunkSchema> {
        tracing::debug!(
            "[TELEGRAM API] starting download of chunk with position \"{}\"",
            chunk.position
        );

        let scheduler = StorageWorkersScheduler::new(self.db, self.rate_limit);

        let data = TelegramBotApi::new(self.telegram_baseurl, scheduler, self.client)
            .download(&chunk.telegram_file_id, storage_id)
            .await?;

        tracing::debug!(
            "[TELEGRAM API] downloaded chunk with file_id \"{}\" and position \"{}\"",
            chunk.telegram_file_id,
            chunk.position
        );

        let chunk = DownloadedChunkSchema::new(chunk.position as i16, data);
        Ok(chunk)
    }
}
