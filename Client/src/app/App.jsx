import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const editorRef = useRef(null);
  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || "";
  }); // This will preserve the username even if the user refreshes the page

  const [users, setUsers] = useState([]); // This will hold the list of users currently connected to the document

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const handleMount = (editor) => {
    editorRef.current = editor;

    new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
      );
  };

  const handleJoin = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    setUsername(e.target.username.value);
    window.history.pushState({}, "", "?username=" + e.target.username.value); // even if the user refreshes the page, the username will be preserved in the URL
  };

  useEffect(() => {

    console.log(username);


    if (username) {
      const provider = new SocketIOProvider(
        "/",
        "monaco",
        ydoc,
        {
          autoConnect: true,
        },
      );

      provider.awareness.setLocalStateField("user", { username }); //users ko usename set karna hi padega uske baad hi he can enter, Set the local user's username in the awareness state
      
      const states = Array.from(provider.awareness.getStates().values()) // Get the awareness states of all users, jitne bhi users hai unka state milega, users
      console.log(states)
      setUsers(states.filter(state => state.user && state.user.username).map(state => state.user)); // Update the list of users
      
      provider.awareness.on("change", () => {
        // This will be called whenever a user joins or leaves the document
        const states = Array.from(provider.awareness.getStates().values()); // Get the awareness states of all users, jitne bhi users hai unka state milega, users ko state man rhe hein
        setUsers(
          states.filter(state => state.user && state.user.username).map((state) => state.user)
        ); // Update the list of users
      });

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null); // Set the local user's username to null when they leave the page
      }

      window.addEventListener("beforeunload", handleBeforeUnload); // This will be called when the user leaves the page

      

      return () => {
        provider.disconnect();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [username]);

  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center">
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your username"
            className="p-2 rounded-lg bg-gray-800 text-white"
            name="username"
          />
          <button className="p-2 rounded-lg bg-amber-50 text-gray-950 font-bold">
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      <aside className="h-full w-1/4 bg-amber-50 rounded-lg">

        <h2 className="text-2xl font-bold p-4 border-b border-gray-300">Users</h2>
        <ul className="p-4">
          {users.map((user, index) => (
            <li key={index} className="p-2 bg-gray-800 text-white rounded mb-2">
              {user.username}
            </li>
          ))}
        </ul>
      </aside>
      <section className="w-3/4 bg-neutral-800 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// Write your code here"
          theme="vs-dark"
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;
