use wasm_bindgen::prelude::*;
use std::sync::{atomic::{AtomicBool, Ordering}, Arc};
use sha2::{ Digest, Sha256 };
use rayon::prelude::*;


const MAX_THREADS: usize = 4;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn init_mine(data: &str, target: &str, difficulty: usize) {
    // Might want to move this later
    let target = target.to_owned() + &"0".repeat(difficulty - target.len());

    // Hashing
    let threads: Vec<usize> = (0..MAX_THREADS).collect();
    let found = Arc::new(AtomicBool::new(false));
    threads.into_par_iter().for_each(|thread| {
        let found = Arc::clone(&found);
        let (hash, nonce) = mine(data.as_bytes(), &target, difficulty, thread, &found);
        if !found.load(Ordering::Relaxed) {
            alert(&format!("Hash: {:?}, Nonce: {:?}", hash, nonce));
        }
        found.store(true, Ordering::Relaxed);
    });
}

 fn mine(data: &[u8], target: &str, difficulty: usize, start: usize, found: &Arc<AtomicBool>) -> (String, usize){
    let mut hash_base = Sha256::new();
    hash_base.update(data);
    let mut hash = hash_base.clone().finalize();
    let mut nonce: usize = start;

    while hex::encode(&hash)
    .chars()
    .take(difficulty)
    .collect::<String>() != target
    && !found.load(Ordering::Relaxed)
    {
        let mut hasher = hash_base.clone();
        nonce += MAX_THREADS;
        hasher.update(nonce.to_string());
        hash = hasher.finalize();
    }

    return (hex::encode(&hash), nonce);
}