"use client";

import { useState } from "react"
import { Table } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [results, setResults] = useState<MiningResult[]>([
    {
      data: "Testing",
      target: "21e8",
      difficulty: 1,
      hash: "21e80b25083d4be3e9d36ad202f9c586d5abbc26a36de1d5d945c23ae36b24b4",
      nonce: 1109776,
    },
    {
      data: "Hello, World!",
      target: "21e8",
      difficulty: 0,
      hash: "21e8c1b5b3f2c4b4c6f6b6b1b6b7b2b2b7b1b2b5b3b6",
      nonce: 1109777,
    }
  ])

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

      globalHashStore = uploadedData;
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
        <Input type="text" placeholder="Input data" className="w-48" />

        <Input type="text" placeholder="Target" className="w-24" />

        <Input type="number" defaultValue="0" className="w-24" />

        <Select defaultValue="1">
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
        <Button>Mine</Button>
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
