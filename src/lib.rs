use wasm_bindgen::prelude::*;
use std::sync::{atomic::{AtomicBool, Ordering}, Arc};
use sha2::{ Digest, Sha256 };
use rayon::prelude::*;


const MAX_THREADS: usize = 8;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn init_mine(data: &str, target: &str, difficulty: usize) {
    // Hashing
    let threads: Vec<usize> = (0..MAX_THREADS).collect();
    let found = Arc::new(AtomicBool::new(false));
    threads.into_par_iter().for_each(|thread| {
        let found = Arc::clone(&found);
        match mine(data.as_bytes(), &target, difficulty, thread, &found) {
            Ok((hash, nonce)) => {
                if !found.load(Ordering::Relaxed) {
                    alert(&format!("Hash: {:?}, Nonce: {:?}", hash, nonce));
                }
                found.store(true, Ordering::Relaxed);
            },
            Err(e) => {
                alert(&format!("Error: {:?}", e));
            }
        }
    });
}

fn mine(data: &[u8], target: &str, difficulty: usize, start: usize, found: &Arc<AtomicBool>) -> Result<(String, usize), Box<dyn std::error::Error>> {
    let mut hash_base = Sha256::new();
    hash_base.update(data);
    let mut hash = hash_base.clone().finalize();
    let mut nonce: usize = start;
    let target = target.to_owned() + &"0".repeat(difficulty);

    while hex::encode(&hash)
    .chars()
    .take(target.len())
    .collect::<String>() != target
    && !found.load(Ordering::Relaxed)
    {
        let mut hasher = hash_base.clone();
        nonce += MAX_THREADS;
        hasher.update(nonce.to_string());
        hash = hasher.finalize();
    }

    return Ok((hex::encode(&hash), nonce));
}