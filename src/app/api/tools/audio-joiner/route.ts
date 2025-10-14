import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const orders = formData.getAll("order") as string[];
    const trimmedStarts = formData.getAll("trimmedStart") as string[];
    const trimmedEnds = formData.getAll("trimmedEnd") as string[];
    const isTrimmedFlags = formData.getAll("isTrimmed") as string[];

    if (!files || files.length < 2) {
      return NextResponse.json({ error: "At least 2 files required" }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = join(tmpdir(), "audio-joiner-" + Date.now());
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const inputFiles: string[] = [];
    const outputFile = join(tempDir, "merged-output.mp3");

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const order = parseInt(orders[i] || i.toString());
        const trimmedStart = parseFloat(trimmedStarts[i] || "0");
        const trimmedEnd = parseFloat(trimmedEnds[i] || "0");
        const isTrimmed = isTrimmedFlags[i] === "true";
        const volume = parseFloat(formData.getAll("volume")[i] as string || "1.0");
        const volumeSegments = JSON.parse(formData.getAll("volumeSegments")[i] as string || "[]");

        // Validate file type
        if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
          return NextResponse.json({ 
            error: `File ${file.name} is not a valid audio or video file` 
          }, { status: 400 });
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
        const inputFileName = `input_${order}_${i}.${fileExtension}`;
        const inputPath = join(tempDir, inputFileName);

        // Save uploaded file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        writeFileSync(inputPath, buffer);

        // If trimming is needed, create a trimmed version
        if (isTrimmed && trimmedStart > 0 || trimmedEnd < file.size) {
          const trimmedFileName = `trimmed_${order}_${i}.mp3`;
          const trimmedPath = join(tempDir, trimmedFileName);

          let ffmpegCommand = `ffmpeg -i "${inputPath}"`;
          
          // Add trimming parameters
          if (trimmedStart > 0) {
            ffmpegCommand += ` -ss ${trimmedStart}`;
          }
          if (trimmedEnd > 0 && trimmedEnd < file.size) {
            ffmpegCommand += ` -t ${trimmedEnd - trimmedStart}`;
          }

          // Extract audio if it's a video file
          if (file.type.startsWith("video/")) {
            ffmpegCommand += ` -vn`; // No video
          }

          // Output as MP3 with volume adjustment
          ffmpegCommand += ` -acodec libmp3lame -ab 128k -af "volume=${volume}" "${trimmedPath}" -y`;

          console.log(`Trimming file ${i}: ${ffmpegCommand}`);
          await execAsync(ffmpegCommand);

          if (existsSync(trimmedPath)) {
            inputFiles.push(trimmedPath);
          } else {
            inputFiles.push(inputPath); // Fallback to original
          }
        } else {
          // Convert to MP3 if needed (for consistency)
          if (!file.name.toLowerCase().endsWith('.mp3')) {
            const mp3FileName = `converted_${order}_${i}.mp3`;
            const mp3Path = join(tempDir, mp3FileName);

            let ffmpegCommand = `ffmpeg -i "${inputPath}"`;
            
            // Extract audio if it's a video file
            if (file.type.startsWith("video/")) {
              ffmpegCommand += ` -vn`; // No video
            }

            // Output as MP3 with volume adjustment
            ffmpegCommand += ` -acodec libmp3lame -ab 128k -af "volume=${volume}" "${mp3Path}" -y`;

            console.log(`Converting file ${i}: ${ffmpegCommand}`);
            await execAsync(ffmpegCommand);

            if (existsSync(mp3Path)) {
              inputFiles.push(mp3Path);
            } else {
              inputFiles.push(inputPath); // Fallback to original
            }
          } else {
            // Apply volume adjustment to existing MP3 files
            if (volume !== 1.0) {
              const volumeAdjustedFileName = `volume_${order}_${i}.mp3`;
              const volumeAdjustedPath = join(tempDir, volumeAdjustedFileName);
              
              const ffmpegCommand = `ffmpeg -i "${inputPath}" -af "volume=${volume}" "${volumeAdjustedPath}" -y`;
              
              console.log(`Adjusting volume for file ${i}: ${ffmpegCommand}`);
              await execAsync(ffmpegCommand);
              
              if (existsSync(volumeAdjustedPath)) {
                inputFiles.push(volumeAdjustedPath);
              } else {
                inputFiles.push(inputPath); // Fallback to original
              }
            } else {
              inputFiles.push(inputPath);
            }
          }
        }
      }

      // Sort files by order
      const sortedFiles = inputFiles.sort((a, b) => {
        const orderA = parseInt(a.split('_')[1]);
        const orderB = parseInt(b.split('_')[1]);
        return orderA - orderB;
      });

      // Merge all files using FFmpeg
      let mergeCommand = `ffmpeg`;
      
      // Add all input files
      sortedFiles.forEach(file => {
        mergeCommand += ` -i "${file}"`;
      });

      // Add filter complex for concatenation
      mergeCommand += ` -filter_complex "${sortedFiles.map((_, index) => `[${index}:0]`).join('')}concat=n=${sortedFiles.length}:v=0:a=1[out]"`;
      mergeCommand += ` -map "[out]" -acodec libmp3lame -ab 128k "${outputFile}" -y`;

      console.log(`Merging files: ${mergeCommand}`);
      await execAsync(mergeCommand);

      if (!existsSync(outputFile)) {
        throw new Error('Merge operation failed - no output file generated');
      }

      // Read the merged file
      const mergedBuffer = readFileSync(outputFile);

      // Clean up temporary files
      try {
        sortedFiles.forEach(file => {
          if (existsSync(file)) unlinkSync(file);
        });
        if (existsSync(outputFile)) unlinkSync(outputFile);
        // Try to remove temp directory (will only work if empty)
        try {
          require('fs').rmdirSync(tempDir);
        } catch (e) {
          // Ignore error if directory is not empty or doesn't exist
        }
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }

      // Return the merged audio file
      return new NextResponse(mergedBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="merged-audio.mp3"`,
          'Cache-Control': 'no-store',
        },
      });

    } catch (mergeError) {
      // Clean up files in case of error
      try {
        inputFiles.forEach(file => {
          if (existsSync(file)) unlinkSync(file);
        });
        if (existsSync(outputFile)) unlinkSync(outputFile);
        try {
          require('fs').rmdirSync(tempDir);
        } catch (e) {
          // Ignore
        }
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }

      console.error('Audio merge error:', mergeError);
      
      // Check if it's an FFmpeg not found error
      if (mergeError instanceof Error && mergeError.message.includes('ffmpeg')) {
        return NextResponse.json({ 
          error: "FFmpeg not available on server. Please try again later." 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        error: "Audio merge failed. Please try with different files." 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}