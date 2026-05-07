import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Circle, useMap, Popup, Polygon } from 'react-leaflet';
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

// 1. Diccionario de Emojis (¡Cambia los nombres por los que salen en tu mapa!)
const emojisDispositivos = {
  "JL": "🤖",
  "joaquin": "🦖",
  "CeluJosefa": "🦄",
  "AutoFamiliar": "🚙"
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

export default function App() {
  const [dispositivos, setDispositivos] = useState({});
  const [dispositivoSeguido, setDispositivoSeguido] = useState('ninguno');
  const [zonaFoco, setZonaFoco] = useState(null);

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
            acc: disp.acc
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

      <div style={{
        position: 'absolute', top: 15, right: 15, zIndex: 1000,
        background: 'white', padding: 15, borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)', fontFamily: 'sans-serif'
      }}>
        <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
          Seguir a:
        </label>
        <select
          value={dispositivoSeguido}
          onChange={(e) => setDispositivoSeguido(e.target.value)}
          style={{ padding: 5, fontSize: 14 }}
        >
          <option value="ninguno">Nadie (Vista libre)</option>
          {Object.entries(dispositivos).map(([idUnico, data]) => (
            <option key={idUnico} value={idUnico}>{data.nombre}</option>
          ))}
        </select>
      </div>

      <MapContainer
        center={[-39.2817, -72.2272]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="http://mt0.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}"
          maxZoom={20}
          attribution="&copy; Google"
        />

        <MapController dispositivoSeguido={dispositivoSeguido} dispositivos={dispositivos} zonaFoco={zonaFoco} setZonaFoco={setZonaFoco} />

        <Polygon
          positions={[
            [-39.301071560206765, -72.13109388410716],
            [-39.30094270013873, -72.13167443376919],
            [-39.301142288736976, -72.13174209063587],
            [-39.301276745426705, -72.13118333817616]
          ]}
          pathOptions={{ color: 'green', fillColor: '#3f0' }}
        />
        <Marker position={[-39.3011, -72.1316]} icon={iconoCasa}>
          <Tooltip direction="top" >CASA</Tooltip>
        </Marker>

        <Polygon
          positions={[
            [-39.29224271334056, -72.22035904953707],
            [-39.29180463267189, -72.2209410469356],
            [-39.29222740762126, -72.2214622614752],
            [-39.292636366618474, -72.22076639359462]
          ]}
          pathOptions={{ color: 'blue', fillColor: '#03f' }}
        />
        <Marker position={[-39.2919, -72.2210]} icon={iconoLink}>
          <Tooltip direction="top" >LINK</Tooltip>
        </Marker>

        <Circle
          center={[-39.2957, -72.3095]}
          radius={50}
          pathOptions={{ color: 'orange', fillColor: 'rgb(255, 123, 0)' }}
        />
        <Marker position={[-39.2957, -72.3095]} icon={iconoPlace}>
          <Tooltip direction="top">Casa Pastores</Tooltip>
        </Marker>

        <Polygon
          positions={[
            [-39.27943088879638, -72.23605462970889],
            [-39.27932811132069, -72.23618970174],
            [-39.279382240125535, -72.23625420109593],
            [-39.279493495928385, -72.23608846476654]
          ]}
          pathOptions={{ color: 'yellow', fillColor: 'rgb(200, 255, 0)' }}
        />
        <Marker position={[-39.2794, -72.2361]} icon={iconoPlace}>
          <Tooltip direction="top" >Casa Suegros</Tooltip>
        </Marker>

        <Polygon
          positions={[
            [-39.29101307400173, -72.2259796852233],
            [-39.29018518392449, -72.22726826154994],
            [-39.29103356903594, -72.22829208189005],
            [-39.291286161063994, -72.22798037780153],
            [-39.29165359383031, -72.22844444032053],
            [-39.29190545469998, -72.22852588130993],
            [-39.292411274230815, -72.22931353184902],
            [-39.29287903258098, -72.22879519212238],
            [-39.29205717501899, -72.22784851877874],
            [-39.29165190821916, -72.2275123320466],
            [-39.29239720319361, -72.22627248895935]
          ]}
          pathOptions={{ color: 'blue', fillColor: 'rgb(255, 0, 34)' }}
        />
        <Marker position={[-39.2912, -72.2269]} icon={iconoCah}>
          <Tooltip direction="top" >CAH</Tooltip>
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
        background: 'white',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        minWidth: '180px'
      }}>

        {/* SECCIÓN 1: DISPOSITIVOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ margin: '0', fontSize: '15px', color: '#333' }}>📱 Dispositivos</h3>

          <button
            onClick={() => {
              setDispositivoSeguido('ninguno');
              setZonaFoco(null); // Limpiamos la zona para poder ver el mapa libremente
            }}
            style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: dispositivoSeguido === 'ninguno' ? '#e0f7fa' : '#f9f9f9' }}
          >
            🗺️ Ver todo el mapa
          </button>

          {Object.entries(dispositivos).map(([idUnico, data]) => (
            <div
              key={idUnico}
              onClick={() => {
                setDispositivoSeguido(idUnico);
                setZonaFoco(null);
              }}
              style={{
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '6px',
                border: '1px solid #ccc',
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
          }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#f9f9f9' }}>
            🏠 Casa Villarrica
          </button>

          <button onClick={() => {
            setDispositivoSeguido('ninguno');
            setZonaFoco({ lat: -39.29118980402745, lon: -72.22706287331756 });
          }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#f9f9f9' }}>
            🏫 CAH
          </button>

          <button onClick={() => {
            setDispositivoSeguido('ninguno');
            setZonaFoco({ lat: -39.27943205151016, lon: -72.23611750901007 });
          }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#f9f9f9' }}>
            👴 Casa Suegros
          </button>

          <button onClick={() => {
            setDispositivoSeguido('ninguno');
            setZonaFoco({ lat: -39.2957, lon: -72.3095 });
          }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#f9f9f9' }}>
            ⛪ Casa Pastores
          </button>

          <button onClick={() => {
            setDispositivoSeguido('ninguno');
            setZonaFoco({ lat: -39.2919, lon: -72.2210 });
          }} style={{ padding: '8px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#f9f9f9' }}>
            🏢 LINK
          </button>
        </div>

      </div>

    </div>
  );
}