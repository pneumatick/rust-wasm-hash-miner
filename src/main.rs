use std::env;
use sha2::{ Sha256, Digest };

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
    let mut hasher = Sha256::new();
    let mut nonce: usize = 0;
    hasher.update(data);
    let mut hash = hasher.finalize();
    // Zero-nonced hash is ignored: FIX
    while hex::encode(&hash)
    .chars()
    .take(difficulty)
    .collect::<String>() != target.clone() + &"0".repeat(difficulty - target.len()){
        hasher = Sha256::new();
        hasher.update(data);
        nonce += 1;
        hasher.update(nonce.to_string());
        hash = hasher.finalize();
    }

    // Output
    println!("Hash: {:x}\nNonce: {:}\nInput string: {:}{:}", hash, nonce, args[1], nonce);
}
