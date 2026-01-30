import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch('http://localhost:3001/api/first-timers', {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjbWwweHdkcG0wMDBjajQ5OGF2cnpqODk3IiwidGVuYW50SWQiOiJjbWwweHdkcGIwMDA4ajQ5OHg4NG54bXVxIiwicm9sZUtleXMiOlsic3VwZXJfYWRtaW4iXSwiaWF0IjoxNzY5NzgwOTk1LCJpc3MiOiJmaXJzdHRpbWVycy1hcGkiLCJhdWQiOiJmaXJzdHRpbWVycy1hZG1pbiIsImV4cCI6MTc3MjM3Mjk5NX0.YLCUqf4yRpjqWTPaqvyG_4aSvZKhWgUvqk_isk65C14`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch first timers from API' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}