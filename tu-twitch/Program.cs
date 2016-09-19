using System;
using System.Diagnostics;
using System.Windows.Forms;
using System.Threading;
using System.Runtime.InteropServices;
using ChatSharp;
using ChatSharp.Events;
using ChatSharp.Handlers;

namespace SpamSpace
{
    class Program
    {
        static void Main(string[] args)
        {
            Thread t = new Thread(InitIRC);
            t.Start();
            t.Name = "IRC Thread";
        }

        [DllImport("user32.dll")]
        public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        public static void InitIRC()
        {
            Console.WriteLine("Initializing IRC...");
            const string token = "-twitch oauth2 token-";
            var client = new IrcClient("irc.chat.twitch.tv", new IrcUser("meharryp1", "meharryp1", "oauth:" + token));

            client.ConnectionComplete += (s, e) =>
            {
                Console.WriteLine("Connected!");
                client.SendRawMessage("CAP REQ :twitch.tv/membership");
                Thread.Sleep(1000);
                client.JoinChannel("#-your twitch username-");
            };

            client.RawMessageRecieved += (s, e) =>
            {
                Console.WriteLine(e.Message);
            };

            client.UserJoinedChannel += (s, e) =>
            {
                Console.WriteLine(e.User);
            };

            client.PrivateMessageRecieved += (s, e) =>
            {
                string arg = e.PrivateMessage.Message.ToLower();
                switch (arg)
                {
                    case "spin":
                        Console.WriteLine("Space was pressed");
                        SendKeystroke(Keys.Space);
                        break;
                    case "bet1":
                        Console.WriteLine("Bet amount changed to 1");
                        SendKeystroke(Keys.D1);
                        break;
                    case "bet3":
                        Console.WriteLine("Bet amount changed to 3");
                        SendKeystroke(Keys.D2);
                        break;
                    case "bet5":
                        Console.WriteLine("Bet amount changed to 5");
                        SendKeystroke(Keys.D3);
                        break;
                }
            };

            client.ConnectAsync();
        }

        public static void SendKeystroke(Keys key)
        {
            var handle = GetForegroundWindow();
            uint pid = 0;
            GetWindowThreadProcessId(handle, out pid);

            Process ActiveProc = Process.GetProcessById((int)pid);
            var name = ActiveProc.ProcessName;

            //if (name != "Tower-Win64-Shipping")
            //{
                const uint WM_KEYDOWN = 0x100;
                const uint WM_KEYUP = 0x101;

                string processName = "Tower-Win64-Shipping";
                Process[] processList = Process.GetProcesses();

                foreach (Process P in processList)
                {
                    if (P.ProcessName.Equals(processName))
                    {
                        IntPtr edit = P.MainWindowHandle;
                        PostMessage(edit, WM_KEYDOWN, (IntPtr)(key), IntPtr.Zero);
                        PostMessage(edit, WM_KEYUP, (IntPtr)(key), IntPtr.Zero);
                    }
                }
           //}
        }
    }
}