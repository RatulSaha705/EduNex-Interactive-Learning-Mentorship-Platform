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

  return <div>{data || "Loading..."}</div>;
}
