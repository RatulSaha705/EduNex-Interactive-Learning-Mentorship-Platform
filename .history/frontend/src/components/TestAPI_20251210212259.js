import { useEffect, useState } from "react";
import axios from "axios";

export default function TestAPI() {
  const [data, setData] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/test") // backend URL
      .then((res) => setData(res.data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-md text-center text-gray-700 text-lg">
        {data || "Loading..."}
      </div>
    </div>
  );
}
