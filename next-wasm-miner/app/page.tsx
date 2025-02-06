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
  nonce: string
}

export default function WASMMiner() {
  const [results, setResults] = useState<MiningResult[]>([
    {
      data: "Testing 21e8",
      target: "21e8",
      difficulty: 0,
      hash: "21e80b25083d4be3e9d36ad202f9c586d5abbc26a36de1d5d945c23ae36b24b4",
      nonce: "1109776",
    },
    // Add other initial results as needed
  ])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Multithreaded WASM Hash Miner</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <Input type="text" placeholder="Input data" className="w-48" />

        <Input type="text" placeholder="Target" className="w-24" />

        <Input type="number" value="0" className="w-24" />

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

        <Button variant="outline">Upload</Button>
        <Button variant="outline">Download</Button>
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
