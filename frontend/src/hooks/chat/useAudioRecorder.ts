import { useRef, useState } from "react";

type Props = {

  onAudioReady: (
    file: File
  ) => Promise<void>;
};

export function useAudioRecorder({
  onAudioReady,
}: Props) {
  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const recordingInterval =
    useRef<any>(null);

    const cancelledRef = useRef(false);

  const [recording, setRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  async function startRecording() {
  try {
    cancelledRef.current = false;

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (
        event
      ) => {
        audioChunksRef.current.push(
          event.data
        );
      };

      mediaRecorder.onstop = async () => {
  if (!cancelledRef.current) {
    const audioBlob = new Blob(
      audioChunksRef.current,
      {
        type: "audio/webm",
      }
    );

    const file = new File(
      [audioBlob],
      `audio-${Date.now()}.webm`,
      {
        type: "audio/webm",
      }
    );

    await onAudioReady(file);
  }

  stream
    .getTracks()
    .forEach((track) => track.stop());

  audioChunksRef.current = [];
};

      const interval =
        setInterval(() => {
          setRecordingTime(
            (prev) => prev + 1
          );
        }, 1000);

      recordingInterval.current =
        interval;

      mediaRecorder.start();

      setRecording(true);
    } catch (err) {
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();

    clearInterval(
      recordingInterval.current
    );

    setRecordingTime(0);

    setRecording(false);
  }

  function cancelRecording() {
  cancelledRef.current = true;

  mediaRecorderRef.current?.stop();

  clearInterval(recordingInterval.current);

  audioChunksRef.current = [];

  setRecordingTime(0);

  setRecording(false);
}

  function formatRecordingTime(
    seconds: number
  ) {
    const mins = Math.floor(
      seconds / 60
    );

    const secs = seconds % 60;

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

 return {
  recording,
  recordingTime,

  startRecording,
  stopRecording,
  cancelRecording,

  formatRecordingTime,
};
}