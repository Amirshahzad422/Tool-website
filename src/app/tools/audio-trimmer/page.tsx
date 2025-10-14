import AudioTrimmerClient from './AudioTrimmerClient';

export const metadata = {
  title: 'Audio Trimmer - Free Online Audio Trimming Tool',
  description: 'Trim and cut your audio files with precision. Upload any audio file and trim it to the exact length you need. Supports MP3, WAV, AAC, OGG, FLAC and more.',
  keywords: 'audio trimmer, audio cutter, trim audio, cut audio, audio editor, online audio tool',
};

export default function AudioTrimmerPage() {
  return <AudioTrimmerClient />;
}
