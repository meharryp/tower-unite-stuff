using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;

namespace CondoDatAss
{
    class Program
    {
        public static BinaryReader file;

        public static string ReadProperty(bool actuallyRead=false) // NOTE: THIS FUNCTION ADVANCES THE FILE BUFFER 4 BYTES NO MATTER WHAT, CONSIDER BEFORE USAGE!!!
        {
            int propertyNameMemory = (int)file.ReadUInt32();
            if (propertyNameMemory <= 0)
            {
                return "";
            }

            char[] propertyName = file.ReadChars(propertyNameMemory);
            string realPropertyName = "";

            foreach (char i in propertyName)
            {
                realPropertyName += i.ToString();
            }

            Console.WriteLine("Property: " + realPropertyName);

            // If the property is real then
            if (realPropertyName != "None\0")
            {
                // Read size of property
                int propertySize = 0;

                // 4 bytes of nothing and a hacky fix for property labels
                if (actuallyRead)
                {
                    propertySize = (int)file.ReadUInt32();
                    byte[] garbage = file.ReadBytes(4);
                    actuallyRead = false;
                } else
                {
                    actuallyRead = true;
                }

                // Read property

                // Create a new base property that we can mutate in to whatever property type we want
                var propertyValue = new BaseProperty();
                
                switch (realPropertyName)
                {
                    case "FloatProperty\0":
                        propertyValue.Value = file.ReadSingle();
                        break;
                    case "StrProperty\0":
                        int stringSize = (int)file.ReadUInt32();
                        char[] charValue = file.ReadChars(stringSize);
                        propertyValue.Value = "";
                        foreach (char i in charValue)
                        {
                            propertyValue.Value += i.ToString();
                        }
                        break;
                    case "ByteProperty\0":
                        propertyValue.Value = Convert.ToByte(string.Format("{0:x}", propertySize));
                        break;
                    case "CanvasTypes\0":
                        actuallyRead = false; // I have no idea what this property does, so this will ignore it.
                        break;
                    case "CanvasTypes::NewEnumerator4\0":
                        actuallyRead = false;
                        break;               // Same here, could break something, but idk
                    default:
                        break; // If there seems to be no implmementation for this property it's either not added yet, or is a property title.
                }
                if (propertyValue.Value != null)
                {
                    Console.WriteLine("Property Value: " + propertyValue.Value);
                }
            }
            ReadProperty(actuallyRead);
            return realPropertyName;
        }

        static void Main(string[] args)
        {
            // TODO: Refactor EVERYTHING
            file = new BinaryReader(new FileStream(args[0], FileMode.Open, FileAccess.Read));

            // First 4 bytes are assigned to how many items the condo contains
            int itemCount = (int)file.ReadUInt32();
            Console.WriteLine(itemCount);

            for (int l = 1; l < itemCount; l++)
            {
                // Next 4 bytes contain how many bytes are assigned to the name of the item
                int itemNameMemory = (int)file.ReadUInt32();
                //Console.Write(itemNameMemory.ToString().PadRight(12));

                // X bytes after that contain the item name
                char[] itemName = file.ReadChars(itemNameMemory);
                string realItemName = "";

                foreach (char i in itemName)
                {
                    realItemName += i.ToString();
                }

                Console.WriteLine("Name: " + realItemName);

                // Advance 16 bytes since I have no idea what the fuck the next bit does
                file.ReadBytes(16);

                // Advance another 16 bytes, figure this out too
                file.ReadBytes(16);

                // Property reading. Theres a lot of these so we make a function that can call itself.
                ReadProperty();

                // After property reading is done, we have 4 bytes of nothing.
                file.ReadBytes(4);

                // Next up: Angle.
                float pitch = file.ReadSingle();
                float yaw = file.ReadSingle();
                float roll = file.ReadSingle();

                Console.WriteLine("Angle:" + pitch.ToString().PadRight(12) + yaw.ToString().PadRight(12) + roll.ToString());
                file.ReadBytes(4);

                // Vector3 position
                float x = file.ReadSingle();
                float y = file.ReadSingle();
                float z = file.ReadSingle();

                Console.WriteLine("Position: " + x.ToString().PadRight(12) + y.ToString().PadRight(12) + z.ToString());

                file.ReadBytes(12);
            }
            Console.ReadKey();
        }
    }
}
