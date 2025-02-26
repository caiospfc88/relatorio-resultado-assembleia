import BotaoPDF_P from "./components/BotaoJsPDF_P";
import BotaoPDFJspdf from "./components/BotaoJsPDF";
import BotaoNovo from "./components/BotaoNovo";



export default function Home() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <BotaoPDFJspdf/>
      <BotaoNovo/>
      <BotaoPDF_P/>
    </div>
  );
}
