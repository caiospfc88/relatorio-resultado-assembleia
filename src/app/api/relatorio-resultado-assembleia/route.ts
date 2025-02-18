import { NextRequest, NextResponse } from "next/server";


export async function POST() { 
    const result = {msg: "Cheguei, Cheguei Brasil!!!"}
    return NextResponse.json(result)
}