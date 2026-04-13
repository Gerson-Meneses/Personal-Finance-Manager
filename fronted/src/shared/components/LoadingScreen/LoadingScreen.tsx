import './LoadingScreen.css'

export default function LoadingScreen({ message = "Cargando tus finanzas..." }: { message?: string }) {
  return (
    <div className="loading-screen-overlay">
      <div className="loader-container">
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
        <p className="loading-text">{message}</p>
        <div className="loading-bar-container">
            <div className="loading-bar-progress"></div>
        </div>
      </div>
    </div>
  );
}