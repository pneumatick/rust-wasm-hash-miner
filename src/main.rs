use std::{env, sync::{atomic::{AtomicBool, Ordering}, Arc}};
use sha2::{ Digest, Sha256 };
use rayon::prelude::*;

const MAX_THREADS: usize = 8;

fn mine(data: &[u8], target: &String, difficulty: usize, start: usize, found: &Arc<AtomicBool>) -> (String, usize) {
    let mut hash_base = Sha256::new();
    hash_base.update(data);
    let mut hash = hash_base.clone().finalize();
    let mut nonce: usize = start;

    while hex::encode(&hash)
    .chars()
    .take(difficulty)
    .collect::<String>() != target.clone() + &"0".repeat(difficulty - target.len()) 
    && !found.load(Ordering::Relaxed) {
        let mut hasher = hash_base.clone();
        nonce += MAX_THREADS;
        hasher.update(nonce.to_string());
        hash = hasher.finalize();
    }

    return (hex::encode(&hash), nonce);
}

fn main() {
    // Input
    let mut args: Vec<String> = env::args().collect();
    args[1].push_str(" ");
    let data = args[1].as_bytes();
    let target = args[2].clone();
    let difficulty = match args.len() {
        4 => args[3].parse::<usize>().unwrap(),
        3 => target.len(),
        _ => {
            println!("Usage: cargo run <data> <target> <difficulty>");
            return;
        }
    };

    if difficulty < target.len() {
        panic!("Difficulty must be greater than or equal to target length");
    }
    
    // Hashing
    let threads: Vec<usize> = (0..MAX_THREADS).collect();
    let found = Arc::new(AtomicBool::new(false));
    threads.into_par_iter().for_each(|thread| {
        let found = Arc::clone(&found);
        let (hash, nonce) = mine(data, &target, difficulty, thread, &found);
        if !found.load(Ordering::Relaxed) {
            println!("Hash: {}\nNonce: {}\nInput string: {}{}", hash, nonce, args[1], nonce);
        }
        found.store(true, Ordering::Relaxed);
    });
}
