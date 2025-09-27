import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync, rmdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const name = (file as any).name || 'input.gif';
    if (!name.toLowerCase().endsWith('.gif')) {
      return NextResponse.json({ error: "Only .gif files are supported" }, { status: 400 });
    }

    const dir = join(tmpdir(), `gif-apng-${Date.now()}`);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const input = join(dir, 'input.gif');
    const output = join(dir, 'output.apng');

    const buf = Buffer.from(await file.arrayBuffer());
    writeFileSync(input, buf);

    const cmd = [
      'ffmpeg',
      '-i', `"${input}"`,
      // Convert to APNG with reasonable defaults
      '-plays', '0', // loop forever
      '-f', 'apng',
      `"${output}"`
    ].join(' ');

    try {
      await execAsync(cmd);
    } catch (e: any) {
      if (e?.stderr?.includes('ffmpeg: command not found')) {
        return NextResponse.json({ error: 'FFmpeg not installed on server' }, { status: 500 });
      }
      throw e;
    }

    if (!existsSync(output)) throw new Error('Output not created');
    const out = readFileSync(output);

    try { unlinkSync(input); } catch {}
    try { unlinkSync(output); } catch {}
    try { rmdirSync(dir); } catch {}

    return new NextResponse(out as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/apng',
        'Content-Disposition': 'attachment; filename="output.apng"',
      }
    });
  } catch (e) {
    console.error('gif-apng api error', e);
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
} 