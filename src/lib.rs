use wasm_bindgen::prelude::*;
use std::sync::{atomic::{AtomicBool, Ordering}, Arc};
use sha2::{ Digest, Sha256 };
use rayon::prelude::*;

// Expose alert to JS (mainly used for debugging)
#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

// For relaying the mining result back to JS
#[wasm_bindgen]
pub struct MineResult {
    hash: String,
    nonce: usize,
}

#[wasm_bindgen]
impl MineResult {
    #[wasm_bindgen(getter)]
    pub fn hash(&self) -> String {
        self.hash.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> usize {
        self.nonce
    }
}

// Initialize the mining process (JS-facing function)
#[wasm_bindgen]
pub fn init_mine(data: &str, target: &str, difficulty: usize, num_threads: usize) -> MineResult {
    let threads: Vec<usize> = (0..num_threads).collect();
    let found = Arc::new(AtomicBool::new(false));
    
    // Parallelize the mining process
    let result = threads.into_par_iter().map(|thread| {
        let found = Arc::clone(&found);
        match mine(data.as_bytes(), &target, difficulty, num_threads, thread, &found) {
            Ok((hash, nonce)) => {
                if !found.load(Ordering::Relaxed) {
                    found.store(true, Ordering::Relaxed);
                    Some(MineResult { hash, nonce })
                }
                else {
                    None
                }
            },
            Err(e) => {
                alert(&format!("Error: {:?}", e));
                None
            }
        }
    });

    // Return the found result or a default empty result when errors occur
    match result.find_map_any(|x| x) {
        Some(result) => result,
        None => MineResult {
            hash: "".to_string(),
            nonce: 0,
        }
    }
}

// Thread-bound mining function
fn mine(data: &[u8], target: &str, difficulty: usize, 
    num_threads: usize, start: usize, found: &Arc<AtomicBool>) 
    -> Result<(String, usize), Box<dyn std::error::Error>> 
{
    let mut hash_base = Sha256::new();
    hash_base.update(data);
    let mut hash = hash_base.clone().finalize();
    let mut nonce: usize = start;
    let target = target.to_owned() + &"0".repeat(difficulty);

    // Mining loop
    while hex::encode(&hash)
    .chars()
    .take(target.len())
    .collect::<String>() != target
    && !found.load(Ordering::Relaxed)
    {
        let mut hasher = hash_base.clone();
        nonce += num_threads;
        hasher.update(nonce.to_string());
        hash = hasher.finalize();
    }

    return Ok((hex::encode(&hash), nonce));
}