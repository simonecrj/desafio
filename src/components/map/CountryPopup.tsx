
type CountryPopupProps = {
    countryName: string | null;
  };
  
  export default function CountryPopup({ countryName }: CountryPopupProps) {
    if (!countryName) {
      return (
        <div className="country-info">
          <h3>Explore o mundo</h3>
          <p>Clique em um país no mapa para selecioná-lo.</p>
        </div>
      );
    }
  
    return (
      <div className="country-info">
        <span className="country-info-label">PAÍS SELECIONADO</span>
        <h3>{countryName}</h3>
        <p>Você selecionou este país para consultar informações climáticas.</p>
  
        <button
          type="button"
          disabled
          title="A consulta de temperaturas será implementada na próxima etapa."
        >
          Consultar temperaturas em breve
        </button>
      </div>
    );
  }
  