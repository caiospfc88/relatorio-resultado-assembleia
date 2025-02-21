import Image from "next/image";
import BotaoPDF from "./components/BotaoPDF";
import BotaoPDFJspdf from "./components/BotaoJsPDF";



export default function Home() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <BotaoPDF/>
      <BotaoPDFJspdf/>
    </div>
  );
}
