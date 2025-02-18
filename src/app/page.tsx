import Image from "next/image";
import BotaoPDF from "./components/BotaoPDF";



export default function Home() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <BotaoPDF/>
    </div>
  );
}
