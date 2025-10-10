import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 audio files are required' },
        { status: 400 }
      );
    }

    // Save uploaded files to temp directory and extract audio if needed
    const inputFiles: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.split('.').pop() || 'tmp';
      const tempPath = join(tmpdir(), `audio-input-${Date.now()}-${i}.${extension}`);
      await writeFile(tempPath, buffer);
      
      // Check if it's a video file and extract audio
      const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'flv'];
      if (videoExtensions.includes(extension.toLowerCase())) {
        const audioPath = join(tmpdir(), `audio-extracted-${Date.now()}-${i}.mp3`);
        try {
          await execPromise(`ffmpeg -i "${tempPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}"`);
          inputFiles.push(audioPath);
          tempFiles.push(audioPath);
        } catch (error) {
          console.error('Error extracting audio from video:', error);
          // If extraction fails, try using the original file
          inputFiles.push(tempPath);
        }
      } else {
        inputFiles.push(tempPath);
      }
      
      tempFiles.push(tempPath);
    }

    // Create output file path
    const outputPath = join(tmpdir(), `audio-merged-${Date.now()}.mp3`);
    tempFiles.push(outputPath);

    // Create concat file for FFmpeg
    const concatFilePath = join(tmpdir(), `concat-${Date.now()}.txt`);
    tempFiles.push(concatFilePath);
    
    const concatContent = inputFiles
      .map(file => `file '${file.replace(/'/g, "'\\''")}'`)
      .join('\n');
    await writeFile(concatFilePath, concatContent);

    // Use FFmpeg to concatenate audio files
    const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}"`;
    
    try {
      await execPromise(ffmpegCommand);
    } catch (error) {
      // If concat with copy fails, try with re-encoding
      const fallbackCommand = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c:a libmp3lame -q:a 2 "${outputPath}"`;
      await execPromise(fallbackCommand);
    }

    // Read the merged file
    const mergedBuffer = await readFile(outputPath);

    // Clean up temp files
    for (const tempFile of tempFiles) {
      try {
        await unlink(tempFile);
      } catch (error) {
        // Ignore cleanup errors
        console.error('Cleanup error:', error);
      }
    }

    // Return the merged audio
    return new NextResponse(mergedBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="merged-audio.mp3"',
      },
    });
  } catch (error) {
    console.error('Error merging audio:', error);

    // Clean up temp files on error
    for (const tempFile of tempFiles) {
      try {
        await unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json(
      { error: 'Failed to merge audio files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

