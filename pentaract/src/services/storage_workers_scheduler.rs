use std::time::{Duration, Instant};

use sqlx::PgPool;
use tokio::time::sleep;
use uuid::Uuid;

use crate::{errors::{PentaractError, PentaractResult}, repositories::storage_workers::StorageWorkersRepository};

/// Manages storage workers by limiting their usage
pub struct StorageWorkersScheduler<'d> {
    repo: StorageWorkersRepository<'d>,
    rate: u8,
}

impl<'d> StorageWorkersScheduler<'d> {
    pub fn new(db: &'d PgPool, rate: u8) -> Self {
        let repo = StorageWorkersRepository::new(db);
        Self { repo, rate }
    }

    pub async fn get_token(&self, storage_id: Uuid) -> PentaractResult<String> {
        // Maximum time to wait for a token (60 seconds)
        const MAX_WAIT_SECS: u64 = 60;
        let deadline = Instant::now() + Duration::from_secs(MAX_WAIT_SECS);

        while Instant::now() < deadline {
            // attempting to get a token
            if let Some(schema) = self.repo.get_token(storage_id, self.rate).await? {
                return Ok(schema.token);
            };

            sleep(Duration::from_secs(1)).await;
        }

        // Timeout reached - no worker available
        tracing::error!(
            "[TELEGRAM API] Timeout waiting for worker for storage \"{}\"",
            storage_id
        );
        Err(PentaractError::WorkerUnavailable)
    }
}
