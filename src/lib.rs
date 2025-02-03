use wasm_bindgen::prelude::*;
use sha2::{ Digest, Sha256 };

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
//pub fn mine(data: &[u8], target: &String, difficulty: usize, start: usize, found: &Arc<AtomicBool>) -> None {
pub fn mine(data: &str, target: &str, difficulty: usize){
    alert(&format!("Data: {:?}, Target: {:?}, Difficulty: {:?}", data, target, difficulty));
    // Temporary
    let MAX_THREADS: usize = 1;
    let start: usize = 0;
    let data = data.as_bytes();

    let mut hash_base = Sha256::new();
    hash_base.update(data);
    let mut hash = hash_base.clone().finalize();
    let mut nonce: usize = start;

    while hex::encode(&hash)
    .chars()
    .take(difficulty)
    .collect::<String>() != target.to_owned() + &"0".repeat(difficulty - target.len()) 
    //&& !found.load(Ordering::Relaxed) {
    {
        let mut hasher = hash_base.clone();
        nonce += MAX_THREADS;
        hasher.update(nonce.to_string());
        hash = hasher.finalize();
    }

    //return (hex::encode(&hash), nonce);
    alert(&format!("Hash: {:?}, Nonce: {:?}", hex::encode(&hash), nonce));
}