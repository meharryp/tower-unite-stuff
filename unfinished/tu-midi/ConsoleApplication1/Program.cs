using System;
using System.Windows.Forms;
using System.Collections.Generic;
using NAudio.Midi;
using System.Threading;

namespace ConsoleApplication1
{
    public class Program
    {
        static T MClamp<T>( T val, T max, T min) where T : System.IComparable<T>{
            T result = val;
            if (val.CompareTo(max) > 0) {
                result = max;
            } else if (val.CompareTo(min) < 0){
                result = min;
            }
            return result;
        }

        static string ConvertKey(char key)
        {
            /*if (char.IsUpper(key))
            {
                return "+" + "(" + key + ")";
            }*/
            return key.ToString();
        }

        static TempoEvent Tempo;
        private static int additonalTime = 0;

        static void Main(string[] args)
        {
            MidiFile file = new MidiFile(args[0]);
            Dictionary<string, char> NoteToKey = new Dictionary<string, char> // There should be a simpler (thats a word) way of doing this, but I don't know enough yet to know about it.
            {
                { "G1", '1' },
                { "A1", '2' },
                { "B1", '3' },
                { "C2", '4' },
                { "D2", '5' },
                { "E2", '6' },
                { "F2", '7' },
                { "G2", '8' },
                { "A2", '9' },
                { "A#2", '(' },
                { "B2", '0' },
                { "C3", 'q' },
                { "C#3", 'Q' },
                { "D3", 'w' },
                { "D#3", 'W' },
                { "F3", 'r' },
                { "G3", 't' },
                { "G#3", 'T' },
                { "A3", 'y' },
                { "A#3", 'Y' },
                { "B3", 'u' },
                { "C4", 'i' },
                { "C#4", 'I' },
                { "D4", 'o' },
                { "D#4", 'O' },
                { "E4", 'p' },
                { "E#4", 'P' },
                { "F4", 'a' },
                { "G4", 's' },
                { "G#4", 'S' },
                { "A4", 'd' },
                { "A#4", 'D' },
                { "B4", 'f' },
                { "C5", 'g' },
                { "C#5", 'G' },
                { "D5", 'h' },
                { "D#5", 'H' },
                { "E5", 'j' },
                { "E#5", 'J' },
                { "F5", 'k' },
                { "G5", 'l' },
                { "G#5", 'L' },
                { "A5", 'z' },
                { "A#5", 'Z' },
                { "B5", 'x' },
                { "C6", 'c' },
                { "C#6", 'C' },
                { "D6", 'v' },
                { "D#6", 'V' },
                { "E6", 'b' },
                { "E#6", 'B' },
                { "F6", 'n' },
                { "F#6", 'N' },
                { "G6", 'm' },
            };

            Console.Write("Enter track number (1-" + file.Events.Tracks.ToString() + ")");
            int Track = int.Parse(Console.ReadLine());
            int additionalTime = 0;
            //file.Events.MidiFileType = 0;
            //TempoEvent Tempo;
            int oldType = file.Events.MidiFileType;
            file.Events.MidiFileType = 0;

            foreach (MidiEvent note in file.Events[0]) // Set the tempo
            {
                try { Tempo = (TempoEvent)note; Console.WriteLine("tempoevent"); break; } catch { }; // this will break variable tempo things, fix later
            }

            file.Events.MidiFileType = oldType;
            foreach (MidiEvent note in file.Events[Track])
            {
                try { Tempo = (TempoEvent)note; Console.WriteLine("tempoevent"); } catch { };
                if ( note.CommandCode == MidiCommandCode.NoteOn)
                {
                    NoteOnEvent noteOn = (NoteOnEvent)note;
                    if (noteOn.NoteName.Length <= 3) // Note will never have a length of more than 3 if it is a melodic note.
                    {
                        Console.Write(("noteOn").PadRight(12));
                        Console.WriteLine(noteOn.NoteName);
                        if (NoteToKey.ContainsKey(noteOn.NoteName)) // Do a note scale down thing later since stuff like the mario theme doesnt like to work because the piano doesnt have enough keys
                        {
                            SendKeys.SendWait(ConvertKey(NoteToKey[noteOn.NoteName]));
                        }
                    }
                    Console.Write(note.DeltaTime.ToString().PadRight( 12 ));
                    Console.Write(Tempo.MicrosecondsPerQuarterNote.ToString().PadRight( 12 ));

                    int timeToSleep = (10000 / file.DeltaTicksPerQuarterNote);
                    Thread.Sleep( timeToSleep + additonalTime ); // convert ticks to ms then 
                    if (note.DeltaTime != 0)
                    {
                        additonalTime = (10000 / note.DeltaTime);
                    }
                } else if (note.CommandCode == MidiCommandCode.NoteOff)
                {
                    // noteoff is handled by NAudio already so we can ignore it, and we dont need to hold keys down because that doesnt happen for the piano
                    //Thread.Sleep(Math.Abs(note.DeltaTime / ( file.DeltaTicksPerQuarterNote / 4 )));
                } //else if ( note.CommandCode == )
            }
            Console.WriteLine("Press any key to continue...");
            Console.ReadKey();
        }
    }
}
