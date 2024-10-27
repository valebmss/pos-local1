const Factura = ({ ventaData }) => {
    const handleImprimir = () => {
      window.print();
    };
  
    const handleEnviar = (destino, tipo) => {
      if (tipo === 'email') {
        // lógica para enviar correo
      } else if (tipo === 'whatsapp') {
        const mensaje = `Factura para ${ventaData.cliente} por un total de ${ventaData.monto_total}`;
        window.open(`https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`);
      }
    };
  
    return (
      <div>
        <h2>Factura #{ventaData.venta_id}</h2>
        <button onClick={handleImprimir}>Imprimir</button>
        <div>
          <input
            type="text"
            placeholder="Correo o WhatsApp"
            onChange={(e) => setDestino(e.target.value)}
          />
          <button onClick={() => handleEnviar(destino, 'email')}>Enviar por Correo</button>
          <button onClick={() => handleEnviar(destino, 'whatsapp')}>Enviar por WhatsApp</button>
        </div>
      </div>
    );
  };
  