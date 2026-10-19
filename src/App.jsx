import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Circle, useMap, Popup, Polygon } from 'react-leaflet';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapController = ({ dispositivoSeguido, dispositivos, zonaFoco, setZonaFoco }) => {
  const map = useMap();

  useEffect(() => {
    if (zonaFoco) {
      // 1. Volamos a la zona
      map.flyTo([zonaFoco.lat, zonaFoco.lon], 16, { animate: true });

      // 2. ¡Inmediatamente borramos la zona de la memoria para soltar la cámara!
      setZonaFoco(null);
    }
    else if (dispositivoSeguido !== 'ninguno' && dispositivos[dispositivoSeguido]) {
      const { lat, lon } = dispositivos[dispositivoSeguido];
      map.panTo([lat, lon], { animate: true });
    }
  }, [dispositivoSeguido, dispositivos, map, zonaFoco, setZonaFoco]);

  return null;
};

// Crear un ícono usando un Emoji (Cero consumo de recursos)
const iconoCasa = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 1; margin: 0; padding: 0;">🏠</div>',
  className: '', // Dejamos la clase vacía para que no le ponga un fondo blanco cuadrado
  iconSize: [28, 28], // El tamaño total en pantalla
  iconAnchor: [14, 14], // El centro exacto del ícono para que apunte bien a la coordenada
});

const iconoLink = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 1; margin: 0; padding: 0;">🏢</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const iconoCah = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 1; margin: 0; padding: 0;">🏫</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const iconoPlace = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 1; margin: 0; padding: 0;">📍</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const iconoMcyM = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 1; margin: 0; padding: 0;">✝️</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// 1. Diccionario de Emojis (¡Cambia los nombres por los que salen en tu mapa!)
const emojisDispositivos = {
  //"JL": "🤖",
  //"Joaquin": "🦖",
  "JF": "🦄",
  //"AutoFamiliar": "🚙"
};

// 2. Función inteligente que crea el ícono dependiendo del nombre
const obtenerIconoPersonalizado = (nombre) => {
  // Busca el emoji arriba. Si el nombre no está, usa un celular genérico (📱).
  const emoji = emojisDispositivos[nombre] || "📱";

  return L.divIcon({
    html: `<div style="font-size: 26px; background: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 5px rgba(248, 248, 248, 0);">${emoji}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const getTiempoRelativo = (tstSecs) => {
  if (!tstSecs) return 'Estado desconocido';
  const diffSecs = Math.floor(Date.now() / 1000) - tstSecs;
  if (diffSecs < 300) return '🟢 En línea'; // Menos de 5 min

  if (diffSecs < 3600) return `🔴 Hace ${Math.floor(diffSecs / 60)} min`;
  if (diffSecs < 86400) return `🔴 Hace ${Math.floor(diffSecs / 3600)} hrs`;
  return `🔴 Hace ${Math.floor(diffSecs / 86400)} días`;
};

function MapApp({ setUsuario }) {
  const [dispositivos, setDispositivos] = useState({});
  const [dispositivoSeguido, setDispositivoSeguido] = useState('ninguno');
  const [zonaFoco, setZonaFoco] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(window.innerWidth > 768);

  useEffect(() => {
    const actualizarUbicacion = async () => {
      try {
        const respuesta = await fetch('https://gps.eainfospa.cl/api/0/last');
        const datos = await respuesta.json();

        // 1. Crear un objeto temporal en lugar de depender del estado anterior
        const nuevosDispositivos = {};

        // 2. Procesar TODA la lógica limpia fuera del hook de estado
        datos.forEach(disp => {
          const idUnico = disp.topic; // "owntracks/user/Celu" (Evita choques en memoria)
          const nombreVisual = disp.topic.split('/').pop(); // "Celu" (Para mostrar en pantalla)

          // Guardar todos los datos asociados a ese identificador seguro
          nuevosDispositivos[idUnico] = {
            nombre: nombreVisual,
            lat: disp.lat,
            lon: disp.lon,
            batt: disp.batt,
            vel: disp.vel,
            acc: disp.acc,
            tst: disp.tst
          };
        });

        // 3. Inyectar todo al estado de React en un solo paso seguro
        setDispositivos(nuevosDispositivos);

      } catch (error) {
        console.error("Error obteniendo ubicación:", error);
      }
    };

    actualizarUbicacion();
    const intervalo = setInterval(actualizarUbicacion, 4000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>



      <MapContainer
        center={[-39.2817, -72.2272]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://mt0.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}"
          maxZoom={20}
          attribution="&copy; Google"
        />

        <MapController dispositivoSeguido={dispositivoSeguido} dispositivos={dispositivos} zonaFoco={zonaFoco} setZonaFoco={setZonaFoco} />

        <Polygon
          positions={[
            [-39.300880376969396, -72.13072976471949],
            [-39.30061077174717, -72.13199364401136],
            [-39.30131645471748, -72.13225287742267],
            [-39.301579229407956, -72.13092079577315]
          ]}
          pathOptions={{ color: 'green', fillColor: '#3f0' }}
        />
        <Marker position={[-39.3011, -72.1316]} icon={iconoCasa}>
          <Tooltip direction="top" >CASA</Tooltip>
        </Marker>

        <Polygon
          positions={[
            [-39.29193003569708, -72.2190484010107],
            [-39.29030295370159, -72.22082673919064],
            [-39.292218458477585, -72.22270073929485],
            [-39.29333744833534, -72.22064797118638]
          ]}
          pathOptions={{ color: 'blue', fillColor: '#03f' }}
        />
        <Marker position={[-39.2919, -72.2210]} icon={iconoLink}>
          <Tooltip direction="top" >LINK</Tooltip>
        </Marker>

        <Polygon
          positions={[
            [-39.2965210300494, -72.30839505921507],
            [-39.29428054464944, -72.30740648466168],
            [-39.29335787128762, -72.30867388118634],
            [-39.29572380664071, -72.3106732118267]
          ]}
          pathOptions={{ color: 'orange', fillColor: 'rgb(255, 123, 0)' }}
        />
        <Marker position={[-39.2957, -72.3095]} icon={iconoPlace}>
          <Tooltip direction="top">Casa Pastores</Tooltip>
        </Marker>

        <Polygon
          positions={[
            [-39.27940657064757, -72.23591889317957],
            [-39.27923381159422, -72.23614011072296],
            [-39.279463342572114, -72.23641868555772],
            [-39.27964931490618, -72.23614141410488]
          ]}
          pathOptions={{ color: 'yellow', fillColor: 'rgb(200, 255, 0)' }}
        />
        <Marker position={[-39.2794, -72.2361]} icon={iconoPlace}>
          <Tooltip direction="top" >Casa Suegros</Tooltip>
        </Marker>

        <Polygon
          positions={[
            [-39.29105916652825, -72.22580215726525],
            [-39.2900700457667, -72.22741458236912],
            [-39.2912151658548, -72.22893478218035],
            [-39.29271351349165, -72.22649388827085]
          ]}
          pathOptions={{ color: 'blue', fillColor: 'rgb(255, 0, 34)' }}
        />
        <Marker position={[-39.2912, -72.2269]} icon={iconoCah}>
          <Tooltip direction="top" >CAH</Tooltip>
        </Marker>


        <Polygon
          positions={[
            [-39.29530809794206, -72.2229409714451],
            [-39.295228640699804, -72.2237644049167],
            [-39.29570254182173, -72.22387339222462],
            [-39.2956965253204, -72.22297337768187]
          ]}
          pathOptions={{ color: 'orange', fillColor: 'rgba(43, 255, 0, 1)' }}
        />
        <Marker position={[-39.29557272557473, -72.22337402790623]} icon={iconoMcyM}>
          <Tooltip direction="top">MCyM</Tooltip>
        </Marker>

        {Object.entries(dispositivos).map(([idUnico, data]) => (
          <Marker key={idUnico} position={[data.lat, data.lon]} icon={obtenerIconoPersonalizado(data.nombre)}>
            {/* El nombre al pasar el mouse */}
            <Tooltip direction="top">{data.nombre}</Tooltip>

            {/* La ventana con datos que se abre al hacer clic */}
            <Popup>
              <div style={{ textAlign: 'center', minWidth: '120px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                  {data.nombre}
                </h4>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                  🔋 Batería: <strong>{data.batt ? `${data.batt}%` : 'N/A'}</strong>
                </p>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                  🚀 Velocidad: <strong>{data.vel ? `${data.vel} km/h` : '0 km/h'}</strong>
                </p>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                  📡 Precisión GPS: <strong>{data.acc ? `±${data.acc} mts` : 'N/A'}</strong>
                </p>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                  🕒 Última vez: <strong>{getTiempoRelativo(data.tst)}</strong>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* PANEL DE CONTROL UNIFICADO */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px', // Todo se queda ordenado a la derecha
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.53)',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: menuAbierto ? '15px' : '0',
        minWidth: '180px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>

        <div
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', color: '#333', fontSize: '16px' }}
        >
          <span>📋 Menú</span>
          <span style={{ fontSize: '12px' }}>{menuAbierto ? '▲' : '▼'}</span>
        </div>

        {menuAbierto && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            {/* SECCIÓN 1: DISPOSITIVOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ margin: '0', fontSize: '15px', color: '#333' }}>📱 Dispositivos</h3>

              <button
                onClick={() => {
                  setDispositivoSeguido('ninguno');
                  setZonaFoco(null); // Limpiamos la zona para poder ver el mapa libremente
                  if (window.innerWidth <= 768) setMenuAbierto(false);
                }}
                style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #0e0b0bff', color: '#333', fontWeight: 'bold', background: dispositivoSeguido === 'ninguno' ? '#e0f7fa' : '#f9f9f9' }}
              >
                🗺️ Ver todo el mapa
              </button>

              {Object.entries(dispositivos).map(([idUnico, data]) => (
                <div
                  key={idUnico}
                  onClick={() => {
                    setDispositivoSeguido(idUnico);
                    setZonaFoco(null);
                    if (window.innerWidth <= 768) setMenuAbierto(false);
                  }}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    border: '1px solid #0a0404',
                    background: dispositivoSeguido === idUnico ? '#e0f7fa' : '#f9f9f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                    {data.nombre}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                    <span>🔋 {data.batt ? `${data.batt}%` : '--'}</span>
                    <span>🚀 {data.vel ? `${data.vel} km/h` : '0'}</span>
                  </div>
                  <div style={{ fontSize: '11px', textAlign: 'right', marginTop: '2px', fontWeight: 'bold' }}>
                    {getTiempoRelativo(data.tst)}
                  </div>
                </div>
              ))}
            </div>

            {/* LÍNEA DIVISORIA */}
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '0' }} />

            {/* SECCIÓN 2: ZONAS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ margin: '0', fontSize: '15px', color: '#333' }}>📍 Mis Zonas</h3>

              <button onClick={() => {
                setDispositivoSeguido('ninguno');
                setZonaFoco({ lat: -39.30110218498343, lon: -72.1314875291286 });
                if (window.innerWidth <= 768) setMenuAbierto(false);
              }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#333', fontWeight: 'bold', border: '1px solid #ccc', background: '#f9f9f9' }}>
                🏠 Casa Villarrica
              </button>

              <button onClick={() => {
                setDispositivoSeguido('ninguno');
                setZonaFoco({ lat: -39.29118980402745, lon: -72.22706287331756 });
                if (window.innerWidth <= 768) setMenuAbierto(false);
              }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#333', fontWeight: 'bold', border: '1px solid #ccc', background: '#f9f9f9' }}>
                🏫 CAH
              </button>

              <button onClick={() => {
                setDispositivoSeguido('ninguno');
                setZonaFoco({ lat: -39.27943205151016, lon: -72.23611750901007 });
                if (window.innerWidth <= 768) setMenuAbierto(false);
              }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#333', fontWeight: 'bold', border: '1px solid #ccc', background: '#f9f9f9' }}>
                👴 Casa Suegros
              </button>

              <button onClick={() => {
                setDispositivoSeguido('ninguno');
                setZonaFoco({ lat: -39.2957, lon: -72.3095 });
                if (window.innerWidth <= 768) setMenuAbierto(false);
              }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#333', fontWeight: 'bold', border: '1px solid #ccc', background: '#f9f9f9' }}>
                ⛪ Casa Pastores
              </button>

              <button onClick={() => {
                setDispositivoSeguido('ninguno');
                setZonaFoco({ lat: -39.2919, lon: -72.2210 });
                if (window.innerWidth <= 768) setMenuAbierto(false);
              }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#333', fontWeight: 'bold', border: '1px solid #ccc', background: '#f9f9f9' }}>
                🏢 LINK
              </button>

              <button onClick={() => {
                setDispositivoSeguido('ninguno');
                setZonaFoco({ lat: -39.29552831102172, lon: -72.22339348097971 });
                if (window.innerWidth <= 768) setMenuAbierto(false);
              }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', color: '#333', fontWeight: 'bold', border: '1px solid #ccc', background: '#f9f9f9' }}>
                ✝️ MCyM
              </button>

              <div style={{ height: '1px', background: '#eee', margin: '10px 0' }}></div>
              <button onClick={() => {
                localStorage.removeItem('gps_user');
                setUsuario(null);
              }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: 'bold' }}>
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

const CORREOS_AUTORIZADOS = [
  "at14am69@gmail.com",
  "josefaivalcarcelvillanueva@gmail.com",
  "j.valcarcelbravo@gmail.com"
];

export default function App() {
  const [usuario, setUsuario] = useState(localStorage.getItem('gps_user') || null);
  const [errorAuth, setErrorAuth] = useState('');

  if (usuario) {
    return (
      <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
        <MapApp setUsuario={setUsuario} />
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId="51363544101-e9ih31026g5kchfeatp5nrktjoo0mf5m.apps.googleusercontent.com">
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1e2f 100%)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        color: '#fff'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '32px',
          padding: '50px 40px',
          width: '90%',
          maxWidth: '380px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
        }}>
          <div style={{ fontSize: '64px', lineHeight: 1, filter: 'drop-shadow(0 0 20px rgba(96, 165, 250, 0.4))' }}>🌍</div>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 'bold', background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>GPS Vivo</h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8' }}>Acceso seguro para la familia</p>
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <GoogleLogin
              theme="filled_black"
              shape="pill"
              text="continue_with"
              onSuccess={credentialResponse => {
                try {
                  const decoded = jwtDecode(credentialResponse.credential);
                  if (CORREOS_AUTORIZADOS.includes(decoded.email)) {
                    localStorage.setItem('gps_user', decoded.email);
                    setUsuario(decoded.email);
                    setErrorAuth('');
                  } else {
                    setErrorAuth(`El correo ${decoded.email} no está autorizado para ver el mapa.`);
                  }
                } catch (e) {
                  setErrorAuth("Error interno al decodificar tu sesión.");
                }
              }}
              onError={() => {
                setErrorAuth("La conexión con Google falló o fue cancelada.");
              }}
            />
          </div>

          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>¿No carga el botón en la App?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="pinInput"
                type="password"
                placeholder="PIN"
                style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #334155', background: 'rgba(0,0,0,0.2)', color: 'white', textAlign: 'center' }}
              />
              <button
                onClick={() => {
                  const pin = document.getElementById('pinInput').value;
                  if (pin === '2304') { // PIN secreto de emergencia
                    localStorage.setItem('gps_user', 'Familia (App)');
                    setUsuario('Familia (App)');
                  } else {
                    setErrorAuth("PIN incorrecto.");
                  }
                }}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Entrar
              </button>
            </div>
          </div>

          {errorAuth && (
            <div style={{
              marginTop: '5px', padding: '14px', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px',
              color: '#fca5a5', fontSize: '13px', lineHeight: 1.5
            }}>
              {errorAuth}
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}