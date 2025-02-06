"use client";

import { useState } from "react"
import { Table } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import init, { init_mine } from "../pkg/wasm_miner.js"; // Remeber to fix the path after testing

interface MiningResult {
  data: string
  target: string
  difficulty: number
  hash: string
  nonce: number
}

interface HashStore {
  [data: string]: {
    [target: string]: {
      [difficulty: number]: [string, number][]
    }
  }
}

let globalHashStore: HashStore = {};

export default function WASMMiner() {
  // Field data
  const [data, setData] = useState("");
  const [target, setTarget] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [threads, setThreads] = useState(1);

  // Mining results
  const [results, setResults] = useState<MiningResult[]>([])

  const mine = async (data: string, target: string, difficulty: number, threads: number) => {
    // Initialize WASM module
    await init();

    // Get the last nonce for this data, target, and difficulty
    const lastNonce = globalHashStore[data]?.[target]?.[difficulty]?.slice(-1)?.[0][1];

    // Mine hash
    const result = init_mine(data, target, difficulty, threads, lastNonce);
    addNewResult(data, target, difficulty, result.hash, result.nonce);
  }

  const handleMine = async () => {
    if (!data || !target) {
      alert("Please provide data and target");
      return
    }
    console.log('Mining:', data, target, difficulty, threads);
    await mine(data, target, difficulty, threads);
  }

  const addNewResult = (data: string, target: string, difficulty: number, hash: string, nonce: number) => {
    // Update UI results
    setResults(prev => [...prev, { data, target, difficulty, hash, nonce }])
    
    // Update global hash store
    if (!globalHashStore[data]) globalHashStore[data] = {};
    if (!globalHashStore[data][target]) globalHashStore[data][target] = {};
    if (!globalHashStore[data][target][difficulty]) globalHashStore[data][target][difficulty] = [];
    
    globalHashStore[data][target][difficulty].push([hash, nonce]);
  }

  const handleUpload = async (event : React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const uploadedData = JSON.parse(text)

    try {
      Object.entries(uploadedData).forEach(([data, targets]: [string, any]) => {
        Object.entries(targets).forEach(([target, difficulties]: [string, any]) => {
          Object.entries(difficulties).forEach(([difficulty, hashes]: [string, any]) => {
            hashes.forEach(([hash, nonce]: [string, number]) => {
              addNewResult(data, target, parseInt(difficulty), hash, nonce);
            })
          })
        })
      })

      //globalHashStore = uploadedData;
    }
    catch (error) {
      console.error('Error uploading file:', error);
    }
  }

  const handleDownload = () => {
    // Convert data to JSON string
    const jsonString = JSON.stringify(globalHashStore, null, 2)
    
    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mining-results.json'
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Multithreaded WASM Hash Miner</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <Input 
          type="text" 
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-48" 
        />

        <Input 
          type="text" 
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-24" 
        />

        <Input 
          type="number" 
          value={difficulty}
          onChange={(e) => setDifficulty(parseInt(e.target.value) || 0)}
          className="w-24" 
        />

        <Select value={threads.toString()} onValueChange={(val) => setThreads(parseInt(val))}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Threads" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="8">8</SelectItem>
          </SelectContent>
        </Select>

        <input 
          type="file" 
          accept=".json"
          onChange={handleUpload} 
          style={{ display: 'none' }}
          id="fileInput"
        />
        <Button variant="outline" onClick={() => document.getElementById('fileInput')?.click()}>Upload</Button>
        <Button variant="outline" onClick={handleDownload}>Download</Button>
        <Button onClick={handleMine}>Mine</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <thead>
            <tr>
              <th className="font-medium">Data</th>
              <th className="font-medium">Target</th>
              <th className="font-medium">Difficulty</th>
              <th className="font-medium">Hash</th>
              <th className="font-medium">Nonce</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index} className="font-mono text-sm">
                <td className="p-2">{result.data}</td>
                <td className="p-2">{result.target}</td>
                <td className="p-2">{result.difficulty}</td>
                <td className="p-2 break-all">{result.hash}</td>
                <td className="p-2">{result.nonce}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
