// --- CONFIGURACIONES ESTRUCTURALES DE LA JORNADA ESCOLAR ---
const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const cronogramaHoras = [
    { id: "H1", label: "07:00 - 07:45" }, { id: "H2", label: "07:45 - 08:30" },
    { id: "R1", label: "08:30 - 08:40", receso: true },
    { id: "H3", label: "08:40 - 09:25" }, { id: "H4", label: "09:25 - 10:10" },
    { id: "H5", label: "10:10 - 10:55" }, { id: "H6", label: "10:55 - 11:40" },
    { id: "R2", label: "11:40 - 11:50", receso: true },
    { id: "H7", label: "11:50 - 12:35" }, { id: "H8", label: "12:35 - 01:20" },
    { id: "H9", label: "01:20 - 02:05" }, { id: "H10", label: "02:05 - 02:50" }
];

const paresBloques = [
    { h1: "H1", h2: "H2" }, { h1: "H3", h2: "H4" },
    { h1: "H5", h2: "H6" }, { h1: "H7", h2: "H8" }, { h1: "H9", h2: "H10" }
];

// Cargar estructura de cursos (Y LIMPIAR FANTASMAS VACÍOS DEL ERROR ANTERIOR)
let cursosEstructura = JSON.parse(localStorage.getItem('cursosEstructura')) || [
    { anio: "1", secciones: ["A"] }, { anio: "2", secciones: ["A", "B"] },
    { anio: "3", secciones: ["A", "B"] }, { anio: "4", secciones: ["A", "B"] },
    { anio: "5", secciones: ["A"] }
];
// Esta línea mágica borra cualquier error vacío guardado
cursosEstructura = cursosEstructura.filter(c => c.anio !== "" && c.anio !== null);
localStorage.setItem('cursosEstructura', JSON.stringify(cursosEstructura));

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    actualizarVistaMaterias();
    actualizarSelectMaterias();
    actualizarVistaProfesores();
    actualizarSelectDocentes(); 
    actualizarListasAdministrativas();
    actualizarTablaHorarioVisual();
    actualizarListaVersionesUI();
});

// FUNCIÓN DE NOTIFICACIONES TOAST
function mostrarNotificacion(mensaje, tipo = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerText = mensaje;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3300);
}

// PESTAÑAS (TABS)
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) tabContents[i].style.display = "none";
    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) tabBtns[i].classList.remove("active");
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

let idMateriaEditando = null;

function cargarMateriaEnFormulario(id) {
  const materias = DB.obtenerMaterias();
  const materia = materias.find(m => m.id === id);
  if (!materia) return;
  
  document.getElementById('mat-nombre').value = materia.nombre;
  document.getElementById('mat-anio').value = materia.anio;
  document.getElementById('mat-horas').value = materia.horas;
  idMateriaEditando = id;
  
  const btnSubmit = document.querySelector('#form-materia .btn-add');
  if (btnSubmit) {
    btnSubmit.textContent = "Actualizar Materia";
    btnSubmit.style.backgroundColor = "#2980b9"; 
  }
  document.getElementById('form-materia').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// CONTROLADORES DE FORMULARIOS 
// ==========================================

// 1. FORMULARIO DE MATERIAS GLOBALES
const formMateria = document.getElementById('form-materia');
if (formMateria) {
    formMateria.addEventListener('submit', function(e) {
      e.preventDefault(); 
      const nombre = document.getElementById('mat-nombre').value.trim();
      const anio = document.getElementById('mat-anio').value;
      const horas = parseInt(document.getElementById('mat-horas').value);
      let materiasExistentes = DB.obtenerMaterias();
      
      const yaExiste = materiasExistentes.some(m => m.nombre.toLowerCase() === nombre.toLowerCase() && m.anio === anio && m.id !== idMateriaEditando);
      if (yaExiste) {
        mostrarNotificacion(`La asignatura "${nombre}" ya está registrada en ${anio}° Año.`, 'error'); return;
      }
      
      if (idMateriaEditando) {
        materiasExistentes = materiasExistentes.map(m => m.id === idMateriaEditando ? { ...m, nombre, anio, horas } : m);
        localStorage.setItem('materias', JSON.stringify(materiasExistentes));
        idMateriaEditando = null;
        const btnSubmit = document.querySelector('#form-materia .btn-add');
        if (btnSubmit) { btnSubmit.textContent = "Registrar Materia"; btnSubmit.style.backgroundColor = ""; }
        mostrarNotificacion(`Asignatura "${nombre}" actualizada.`, 'info');
      } else {
        DB.guardarMateria({ id: Date.now().toString(), nombre, anio, horas });
        mostrarNotificacion(`"${nombre}" registrada exitosamente.`, 'success');
      }
      this.reset();
      actualizarVistaMaterias();
      actualizarSelectMaterias();
    });
}

// 2. FORMULARIO DE ASIGNACIÓN DE PROFESORES
const formProfesor = document.getElementById('form-profesor');
if (formProfesor) {
    formProfesor.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        const inputNombre = document.getElementById('prof-seleccionado') || document.getElementById('prof-nombre');
        const nombreDocente = inputNombre ? inputNombre.value.trim() : "";
        const materiaId = document.getElementById('prof-materia') ? document.getElementById('prof-materia').value : "";
        const seccion = document.getElementById('prof-seccion') ? document.getElementById('prof-seccion').value : "";

        if (!nombreDocente || !materiaId || !seccion) {
            mostrarNotificacion("Por favor complete todos los datos: Profesor, Materia y Sección.", "error"); return;
        }

        const materias = DB.obtenerMaterias();
        const mat = materias.find(m => m.id === materiaId);
        if (!mat) {
            mostrarNotificacion("Error al identificar la materia.", "error"); return;
        }

        const anio = mat.anio; // El año se extrae automático
        const profesoresAsignados = DB.obtenerProfesores();
        
        // Validación de Carga Horaria (Max 40)
        const horasActuales = profesoresAsignados.filter(p => p.nombre.toLowerCase() === nombreDocente.toLowerCase()).reduce((sum, p) => sum + p.horasCarga, 0);
        if (horasActuales + mat.horas > 40) {
            mostrarNotificacion(`Error: ${nombreDocente} excede las 40 horas semanales (Lleva ${horasActuales}h).`, 'error'); return;
        }

        // Validación anti-duplicados
        const yaAsignada = profesoresAsignados.some(p => p.nombre.toLowerCase() === nombreDocente.toLowerCase() && p.materiaId === materiaId && p.anio === anio && p.seccion === seccion);
        if (yaAsignada) {
            mostrarNotificacion(`El profesor ya tiene asignada ${mat.nombre} en ${anio}° "${seccion}".`, 'error'); return;
        }

        const textoCursoCombinado = `${anio}° Año - Sec. "${seccion}"`;

        DB.guardarProfesor({
            id: Date.now().toString(),
            nombre: nombreDocente,
            materia: mat.nombre,
            materiaId: mat.id,
            anio: anio, 
            seccion: seccion,
            curso: textoCursoCombinado,
            cursoDictado: textoCursoCombinado,
            horasCarga: mat.horas
        });

        this.reset();
        actualizarVistaProfesores();
        mostrarNotificacion(`Materia asignada a ${nombreDocente} correctamente.`, 'success');
    });
}

// 3. ADMIN AULAS Y DOCENTES
const formRegistroDocente = document.getElementById('form-registro-docente');
if (formRegistroDocente) {
    formRegistroDocente.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = document.getElementById('nuevo-docente-nombre').value.trim();
        let docentesBase = JSON.parse(localStorage.getItem('docentesBase')) || [];
        
        if (docentesBase.some(d => d.nombre.toLowerCase() === nombre.toLowerCase())) {
            mostrarNotificacion("Este docente ya está registrado.", "error"); return;
        }
        
        docentesBase.push({ id: Date.now().toString(), nombre });
        localStorage.setItem('docentesBase', JSON.stringify(docentesBase));
        mostrarNotificacion(`Docente ${nombre} registrado con éxito.`, "success");
        this.reset();
        actualizarListasAdministrativas();
        actualizarSelectDocentes(); 
    });
}

const formAdminAulas = document.getElementById('form-admin-aulas');
if (formAdminAulas) {
    formAdminAulas.addEventListener('submit', function(e) {
        e.preventDefault();
        const anio = document.getElementById('aula-anio').value;
        const seccion = document.getElementById('aula-seccion').value.toUpperCase();
        
        let curso = cursosEstructura.find(c => c.anio === anio);
        if (curso) {
            if (curso.secciones.includes(seccion)) {
                mostrarNotificacion(`La sección "${seccion}" ya existe en ${anio}° Año.`, "error"); return;
            }
            curso.secciones.push(seccion);
            curso.secciones.sort();
        } else {
            cursosEstructura.push({ anio: anio, secciones: [seccion] });
        }
        
        localStorage.setItem('cursosEstructura', JSON.stringify(cursosEstructura));
        mostrarNotificacion(`Sección "${seccion}" agregada a ${anio}° Año.`, "success");
        this.reset();
        actualizarListasAdministrativas();
    });
}

function eliminarDocenteBase(nombre) {
    if(!confirm(`¿Eliminar al docente ${nombre} de la base de datos?`)) return;
    let docentesBase = JSON.parse(localStorage.getItem('docentesBase')) || [];
    docentesBase = docentesBase.filter(d => d.nombre !== nombre);
    localStorage.setItem('docentesBase', JSON.stringify(docentesBase));
    actualizarListasAdministrativas();
    actualizarSelectDocentes();
}

function eliminarSeccionAdmin(anio, seccion) {
    if(!confirm(`¿Eliminar la sección "${seccion}" de ${anio}° Año?`)) return;
    let curso = cursosEstructura.find(c => c.anio === anio);
    if(curso) {
        curso.secciones = curso.secciones.filter(s => s !== seccion);
        localStorage.setItem('cursosEstructura', JSON.stringify(cursosEstructura));
        actualizarListasAdministrativas();
    }
}

// ==========================================
// VISTAS Y TABLAS
// ==========================================
function actualizarListasAdministrativas() {
    // Lista Docentes
    const listaDocentes = document.getElementById('lista-docentes-registrados');
    if (listaDocentes) {
        listaDocentes.innerHTML = '';
        let docentesBase = JSON.parse(localStorage.getItem('docentesBase')) || [];
        docentesBase.forEach(d => {
            listaDocentes.innerHTML += `<li style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <span><strong>${d.nombre}</strong></span>
                <button onclick="eliminarDocenteBase('${d.nombre}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Eliminar</button>
            </li>`;
        });
    }

    // Lista Aulas
    const listaCursos = document.getElementById('lista-cursos-registrados');
    if (listaCursos) {
        listaCursos.innerHTML = '';
        cursosEstructura.sort((a,b) => a.anio - b.anio).forEach(c => {
            c.secciones.forEach(sec => {
                listaCursos.innerHTML += `<li style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <span><strong>${c.anio}° Año</strong> - Sección "${sec}"</span>
                    <button onclick="eliminarSeccionAdmin('${c.anio}', '${sec}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Eliminar</button>
                </li>`;
            });
        });
    }
}

function actualizarVistaMaterias() {
  const contenedor = document.getElementById('contenedor-fichas-materias');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  const filterBusqueda = document.getElementById('buscar-materia')?.value.toLowerCase().trim() || '';
  const filterAnio = document.getElementById('filtrar-anio')?.value || 'todos';
  let materias = DB.obtenerMaterias();
  materias = materias.filter(m => {
    const coincideTexto = m.nombre.toLowerCase().includes(filterBusqueda);
    const coincideAnio = (filterAnio === 'todos') || (m.anio === filterAnio);
    return coincideTexto && coincideAnio;
  });
  if (materias.length === 0) return;
  
  materias.sort((a, b) => a.anio.localeCompare(b.anio)).forEach(m => {
    const ficha = document.createElement('div');
    ficha.className = 'materia-card animate-card';
    const coloresAnio = { "1": "#2c3e50", "2": "#16a085", "3": "#2980b9", "4": "#8e44ad", "5": "#d35400" };
    ficha.style.backgroundColor = coloresAnio[m.anio] || "#34495e";
    ficha.innerHTML = `
      <div class="materia-card-content">
        <h3>${m.nombre}</h3><div class="info-tag"><strong>Año:</strong> ${m.anio}° Año</div>
        <div class="info-tag"><strong>Carga Horaria:</strong> ${m.horas} horas semanales</div>
      </div>
      <div class="materia-card-actions">
        <button class="btn-editar-ficha" onclick="cargarMateriaEnFormulario('${m.id}')">Editar</button>
        <button class="btn-eliminar-ficha" onclick="borrarMateriaRegistro('${m.id}')">Eliminar</button>
      </div>`;
    contenedor.appendChild(ficha);
  });
}

function borrarMateriaRegistro(id) {
  if (confirm("¿Deseas eliminar esta asignatura?")) { DB.eliminarMateria(id); actualizarVistaMaterias(); actualizarSelectMaterias(); }
}

function actualizarSelectMaterias() {
    const select = document.getElementById('prof-materia');
    if (!select) return;
    select.innerHTML = '<option value="">Asignar Materia de la BD Global</option>';
    DB.obtenerMaterias().forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.textContent = `${m.nombre} (${m.anio}° Año)`;
        select.appendChild(opt);
    });
}

function actualizarSelectDocentes() {
    const select = document.getElementById('prof-seleccionado');
    if (!select || select.tagName !== 'SELECT') return; 
    select.innerHTML = '<option value="">Seleccione un Profesor...</option>';
    let docentesBase = JSON.parse(localStorage.getItem('docentesBase')) || [];
    docentesBase.forEach(d => {
        const opt = document.createElement('option'); opt.value = d.nombre; opt.textContent = d.nombre; select.appendChild(opt);
    });
}

function actualizarVistaProfesores() {
    const tbody = document.getElementById('tabla-profesores-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    DB.obtenerProfesores().forEach(p => {
        const cursoVisual = p.cursoDictado || p.curso || (p.anio ? `${p.anio}° Año - Sec. "${p.seccion}"` : "No asignado");
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.nombre}</strong></td>
            <td>${p.materia}</td>
            <td style="color: #2c3e50; font-weight: 500;">${cursoVisual}</td>
            <td>${p.horasCarga} horas</td>
            <td><button class="btn-delete-row" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;" onclick="borrarProfesorRegistro('${p.id}')">Eliminar</button></td>`;
        tbody.appendChild(tr);
    });
}

function borrarProfesorRegistro(id) {
    if (confirm("¿Deseas revocar esta asignación académica?")) { DB.eliminarProfesor(id); actualizarVistaProfesores(); }
}

// ==========================================
// MOTOR Y TABLA HORARIOS
// ==========================================
function eliminarHorariosTotales() {
    // Verificar si hay algo que borrar primero
    const horarioExistente = DB.obtenerHorarioGlobal();
    
    if (Object.keys(horarioExistente).length === 0) {
        mostrarNotificacion("No hay ningún horario generado para eliminar.", "info");
        return;
    }

    // Mensaje de advertencia más contundente
    if (confirm("🚨 ¿Estás totalmente seguro de que deseas ELIMINAR TODOS los horarios generados?\n\nEsta acción dejará la cuadrícula vacía y no se puede deshacer.")) { 
        DB.vaciarHorarios();
        actualizarTablaHorarioVisual(); 
        mostrarNotificacion("Horario eliminado por completo.", "warning");
    }
}

function procesarMotorHorarios() {
    // 1. Verificar si ya existe un horario previo
    const horarioExistente = DB.obtenerHorarioGlobal();
    
    // Si el objeto tiene datos, significa que ya hay un horario generado
    if (Object.keys(horarioExistente).length > 0) {
        const confirmar = confirm("⚠️ ¡Atención! Ya existe un horario generado.\n\nSi continúas, el horario actual se guardará en tu historial de versiones (máx. 3) y se generará uno nuevo.\n\n¿Estás seguro de que deseas continuar?");
        
        if (!confirmar) {
            mostrarNotificacion("Generación de horario cancelada.", "info");
            return; // Detiene la ejecución de la función
        }

        // >>> 2. RESPALDO AUTOMÁTICO ANTES DE GENERAR UNO NUEVO <<<
        respaldarHorarioActual();
    }

    // --- 3. Lógica original del generador anticlúster ---
    let nuevoHorarioGlobal = {};
    const profesores = DB.obtenerProfesores();
    let poolCargaProfesores = profesores.map(p => ({ ...p, bloquesRestantes: Math.floor(p.horasCarga / 2) }));

    const mezclar = (array) => { 
        for (let i = array.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; 
        } 
        return array; 
    };

    paresBloques.forEach(par => {
        mezclar([...dias]).forEach(dia => {
            let profesoresOcupadosAhora = [];
            mezclar([...cursosEstructura]).forEach(curso => {
                curso.secciones.forEach(seccion => {
                    const cursoKey = `${curso.anio}-${seccion}`;
                    if (!nuevoHorarioGlobal[cursoKey]) nuevoHorarioGlobal[cursoKey] = {};
                    if (!nuevoHorarioGlobal[cursoKey][dia]) nuevoHorarioGlobal[cursoKey][dia] = {};
                    
                    let materiasHoy = Object.values(nuevoHorarioGlobal[cursoKey][dia]).map(v => v.materia);
                    
                    const asignacionValida = mezclar([...poolCargaProfesores]).find(p => 
                        p.anio === curso.anio && p.seccion === seccion && p.bloquesRestantes > 0 &&
                        !profesoresOcupadosAhora.includes(p.nombre) && 
                        !materiasHoy.includes(p.materia)
                    );

                    if (asignacionValida) {
                        const idx = poolCargaProfesores.findIndex(prof => prof.id === asignacionValida.id);
                        poolCargaProfesores[idx].bloquesRestantes--;
                        profesoresOcupadosAhora.push(asignacionValida.nombre);
                        nuevoHorarioGlobal[cursoKey][dia][par.h1] = { materia: asignacionValida.materia, profesor: asignacionValida.nombre };
                        nuevoHorarioGlobal[cursoKey][dia][par.h2] = { materia: asignacionValida.materia, profesor: asignacionValida.nombre };
                    }
                    DB.guardarHorarioGlobal(nuevoHorarioGlobal);
                    mostrarNotificacion("¡Horario Generado! El anterior se guardó en el historial.", "success");
                    actualizarTablaHorarioVisual();
                    actualizarListaVersionesUI();
                });
            });
        });
    });
}

// Función para guardar el horario actual en el historial de versiones
function respaldarHorarioActual() {
    const horarioActual = DB.obtenerHorarioGlobal();
    
    // Si no hay un horario generado actualmente, no respaldamos nada
    if (!horarioActual || Object.keys(horarioActual).length === 0) return;

    // Obtener las versiones anteriores que ya existan en LocalStorage
    let versiones = JSON.parse(localStorage.getItem('historial_versiones')) || [];

    // Crear el nuevo respaldo con la fecha y hora actual
    const nuevoRespaldo = {
        id: Date.now(), // ID único basado en el tiempo
        fecha: new Date().toLocaleString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        }),
        datos: horarioActual
    };

    // Agregar la versión actual al INICIO del arreglo (la más reciente primero)
    versiones.unshift(nuevoRespaldo);

    // Si excede las 3 versiones, cortamos el arreglo para quedarnos solo con las 3 últimas
    if (versiones.length > 3) {
        versiones = versiones.slice(0, 3);
    }

    // Guardar el historial actualizado
    localStorage.setItem('historial_versiones', JSON.stringify(versiones));
}

// Función para obtener la lista de versiones guardadas
function obtenerVersionesAnteriores() {
    return JSON.parse(localStorage.getItem('historial_versiones')) || [];
}

function restaurarVersiónAnterior(index) {
    const versiones = obtenerVersionesAnteriores();
    const versionSeleccionada = versiones[index];

    if (!versionSeleccionada) {
        mostrarNotificacion("No existe ninguna versión en esta posición.", "error");
        return;
    }

    const confirmar = confirm(`¿Estás seguro de que deseas restaurar la versión del ${versionSeleccionada.fecha}?\n\nEsto reemplazará el horario que tienes actualmente en pantalla.`);

    if (confirmar) {
        // Opcional: Podrías respaldar el horario actual antes de pisarlo, 
        // pero como el límite es 3, podría empujar una versión vieja fuera del historial.
        
        // Guardamos los datos de la versión elegida como el horario global activo
        DB.guardarHorarioGlobal(versionSeleccionada.datos);
        
        // Actualizamos la interfaz
        actualizarTablaHorarioVisual();
        
        mostrarNotificacion(`Versión del ${versionSeleccionada.fecha} restaurada con éxito.`, "success");
    }
    DB.guardarHorarioGlobal(versionSeleccionada.datos);
    actualizarTablaHorarioVisual();
    mostrarNotificacion(`Versión del ${versionSeleccionada.fecha} restaurada.`, "success");
    actualizarListaVersionesUI();
}

function actualizarListaVersionesUI() {
    const versiones = obtenerVersionesAnteriores();
    const contenedor = document.getElementById('lista-versiones'); 
    
    if (!contenedor) return; // Seguridad por si el HTML no ha cargado

    // Si no hay respaldos guardados todavía
    if (versiones.length === 0) {
        contenedor.innerHTML = "<p style='color: #95a5a6; font-style: italic; margin: 0;'>No hay versiones anteriores guardadas todavía.</p>";
        return;
    }

    // Construimos la lista con los botones
    let html = "<ul class='versiones-list'>";
    versiones.forEach((v, index) => {
        html += `
            <li class="version-item">
                <div class="version-info">
                    <strong>Respaldo:</strong> ${v.fecha}
                </div>
                <button onclick="restaurarVersiónAnterior(${index})" class="btn-restaurar">
                    🔄 Restaurar esta versión
                </button>
            </li>
        `;
    });
    html += "</ul>";
    
    contenedor.innerHTML = html;
}

function actualizarTablaHorarioVisual() {
    const anioEl = document.getElementById('filtro-anio');
    const secEl = document.getElementById('filtro-seccion');
    if(!anioEl || !secEl) return;
    const cursoKey = `${anioEl.value}-${secEl.value}`;
    const tbody = document.getElementById('matriz-horario-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    const horarioMatrizGlobal = DB.obtenerHorarioGlobal();

    cronogramaHoras.forEach(bloque => {
        const tr = document.createElement('tr');
        if (bloque.receso) {
            tr.innerHTML = `<td class="receso-row">${bloque.label}</td><td colspan="5" class="receso-row">RECESO ESCOLAR (10 MIN)</td>`;
        } else {
            const tdHora = document.createElement('td'); tdHora.textContent = bloque.label; tr.appendChild(tdHora);
            dias.forEach(dia => {
                const tdDia = document.createElement('td');
                if (horarioMatrizGlobal[cursoKey]?.[dia]?.[bloque.id]) {
                    const dataCelda = horarioMatrizGlobal[cursoKey][dia][bloque.id];
                    tdDia.innerHTML = `<div class="cell-materia">${dataCelda.materia}</div><span class="cell-profesor">${dataCelda.profesor}</span>`;
                } else {
                    tdDia.innerHTML = `<span style="color:#bdc3c7; font-size:0.75rem;">Vacío</span>`;
                }
                tr.appendChild(tdDia);
            });
        }
        tbody.appendChild(tr);
    });
}

// ==========================================
// FUNCIÓN PARA GENERAR LA SÁBANA GENERAL
// ==========================================

function generarSabana() {
    const horarioMatrizGlobal = DB.obtenerHorarioGlobal();
    
    // Validar si hay horarios generados
    if (Object.keys(horarioMatrizGlobal).length === 0) {
        mostrarNotificacion("No hay horarios generados para mostrar la sábana.", "error");
        return;
    }

    // 1. Obtener todas las secciones activas y ordenarlas (Ej: ["1-A", "1-B", "2-A"...])
    let cursosActivos = [];
    cursosEstructura.sort((a,b) => a.anio - b.anio).forEach(curso => {
        curso.secciones.sort().forEach(sec => {
            cursosActivos.push(`${curso.anio}-${sec}`);
        });
    });

    if (cursosActivos.length === 0) {
        mostrarNotificacion("No hay cursos ni secciones registradas.", "error");
        return;
    }

    let html = "";

    // 2. Iterar por cada día de la semana
    dias.forEach(dia => {
        html += `
        <div class="sabana-dia">
            <h3>📅 ${dia}</h3>
            <div class="table-responsive">
                <table class="schedule-matrix sabana-table">
                    <thead>
                        <tr>
                            <th style="min-width: 100px;">Hora</th>`;
        
        // Cabeceras de los cursos (columnas)
        cursosActivos.forEach(cursoKey => {
            const [anio, sec] = cursoKey.split('-');
            html += `<th>${anio}° "${sec}"</th>`;
        });
        
        html += `       </tr>
                    </thead>
                    <tbody>`;

        // 3. Iterar por cada bloque de hora
        cronogramaHoras.forEach(bloque => {
            if (bloque.receso) {
                // Fila de Receso
                html += `<tr>
                            <td class="receso-row">${bloque.label}</td>
                            <td colspan="${cursosActivos.length}" class="receso-row">RECESO ESCOLAR</td>
                         </tr>`;
            } else {
                // Fila de Hora de Clase Normal
                html += `<tr>
                            <td><strong>${bloque.label}</strong></td>`;
                
                // Extraer la celda de cada curso para esta hora específica
                cursosActivos.forEach(cursoKey => {
                    const dataCelda = horarioMatrizGlobal[cursoKey]?.[dia]?.[bloque.id];
                    
                    if (dataCelda) {
                        html += `<td>
                                    <div class="cell-materia">${dataCelda.materia}</div>
                                    <span class="cell-profesor">${dataCelda.profesor}</span>
                                 </td>`;
                    } else {
                        html += `<td><span style="color:#bdc3c7; font-size:0.75rem;">Vacío</span></td>`;
                    }
                });

                html += `</tr>`;
            }
        });

        html += `       </tbody>
                </table>
            </div>
        </div>`;
    });

    // 4. Inyectar en el HTML y mostrar
    const contenedorPrincipal = document.getElementById('contenedor-sabana-general');
    const contenedorContenido = document.getElementById('contenido-sabana');
    
    if (contenedorPrincipal && contenedorContenido) {
        contenedorContenido.innerHTML = html;
        contenedorPrincipal.style.display = "block"; // Lo hacemos visible
        
        // Hacemos scroll suave para que el usuario vea que apareció
        contenedorPrincipal.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        mostrarNotificacion("Sábana generada correctamente.", "info");
    }
}

// ====================================================================
// FUNCIÓN PARA EXPORTAR LA SÁBANA COMPLETA COMO UNA SOLA TABLA EN PDF
// ====================================================================
function exportarSabanaPDF() {
    const horarioMatrizGlobal = DB.obtenerHorarioGlobal();
    
    // Validar si existen datos para exportar
    if (!horarioMatrizGlobal || Object.keys(horarioMatrizGlobal).length === 0) {
        mostrarNotificacion("No hay ningún horario generado para exportar a PDF.", "error");
        return;
    }

    // 1. Obtener y ordenar los cursos/secciones para las columnas (Ej: 1°A, 1°B, 2°A...)
    let cursosActivos = [];
    cursosEstructura.sort((a,b) => a.anio - b.anio).forEach(curso => {
        curso.secciones.sort().forEach(sec => {
            cursosActivos.push(`${curso.anio}-${sec}`);
        });
    });

    if (cursosActivos.length === 0) {
        mostrarNotificacion("No hay cursos ni secciones configuradas.", "error");
        return;
    }

    // 2. Construir la ESTRUCTURA DE LA SÚPER TABLA ÚNICA
    let tablaHtml = `
        <table class="pdf-table">
            <thead>
                <tr>
                    <th style="width: 80px;">Día</th>
                    <th style="width: 90px;">Hora</th>
    `;
    
    // Inyectar las columnas de las secciones en la cabecera única
    cursosActivos.forEach(cursoKey => {
        const [anio, sec] = cursoKey.split('-');
        tablaHtml += `<th>${anio}° "${sec}"</th>`;
    });
    
    tablaHtml += `
                </tr>
            </thead>
            <tbody>
    `;

    // 3. Alimentar las filas de forma consecutiva (Día tras Día, Bloque tras Bloque)
    dias.forEach(dia => {
        cronogramaHoras.forEach(bloque => {
            tablaHtml += `<tr>`;
            
            // Columna del Día y de la Hora
            tablaHtml += `<td class="col-dia"><strong>${dia}</strong></td>`;
            tablaHtml += `<td class="col-hora">${bloque.label}</td>`;

            if (bloque.receso) {
                // Si es hora de receso, la fila se unifica por completo
                tablaHtml += `<td colspan="${cursosActivos.length}" class="pdf-receso">RECESO ESCOLAR</td>`;
            } else {
                // Si es hora de clase, buscamos qué materia toca en cada columna
                cursosActivos.forEach(cursoKey => {
                    const dataCelda = horarioMatrizGlobal[cursoKey]?.[dia]?.[bloque.id];
                    
                    if (dataCelda) {
                        tablaHtml += `
                            <td class="pdf-celda">
                                <div class="pdf-materia">${dataCelda.materia}</div>
                                <div class="pdf-profesor">${dataCelda.profesor}</div>
                            </td>
                        `;
                    } else {
                        tablaHtml += `<td class="pdf-vacio">-</td>`;
                    }
                });
            }
            
            tablaHtml += `</tr>`;
        });
    });

    tablaHtml += `
            </tbody>
        </table>
    `;

    // 4. Crear un entorno de impresión virtual aislado con CSS profesional para PDF
    const ventanaImpresion = window.open('', '_blank');
    
    ventanaImpresion.document.write(`
            <html>
                <head>
                    <style>
                    @page {
                        size: letter landscape;
                        /* Márgenes normales para todas las páginas */
                        margin: 15mm;
                    }

                    /* El encabezado ya no es fijo, será parte del contenido inicial */
                    #encabezado-unico {
                        width: 100%;
                        height: 120px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #2c3e50;
                        margin-bottom: 30px; /* Espacio antes de que empiece la tabla */
                    }

                    .logo-img { height: 90px; width: auto; object-fit: contain; }

                    body { font-family: 'Arial', sans-serif; }
                    
                    /* La tabla empezará después del encabezado, no tendrá top-padding */
                    .pdf-table { width: 100%; border-collapse: collapse; }

                /* 2. El contenedor del membrete ahora es relativo y se mueve con el scroll */
                #encabezado-fijo {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 120px;
                    background: white;
                    display: flex;
                    justify-content: space-around; /* Reparte tus 3 logos */
                    align-items: center;
                    border-bottom: 2px solid #2c3e50;
                    z-index: 1000;
                }

                .logo-img { 
                    height: 90px; /* Ajusta este tamaño si los logos salen muy grandes */
                    width: auto;
                    object-fit: contain;
                }

                /* 3. La tabla queda debajo del espacio reservado */
                .pdf-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 10px;
                }
                .espacio-membrete::after {
                    content: "📍 Liceo Nacional Guayana (120px / 4.5cm)";
                    color: #95a5a6;
                    font-size: 10pt;
                    font-weight: bold;
                }
                
                .titulo-reporte {
                    text-align: center;
                    font-size: 14pt;
                    font-weight: bold;
                    margin-bottom: 25px;
                    text-transform: uppercase;
                    color: #1a252f;
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 6px;
                    letter-spacing: 0.5px;
                }
                
                /* ESTILOS DE LA SÚPER TABLA GENERAL */
                .pdf-table {
                    width: 100%;
                    border-collapse: collapse;
                    page-break-inside: auto;
                }
                .pdf-table tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                .pdf-table th, .pdf-table td {
                    border: 1px solid #7f8c8d;
                    padding: 6px 4px;
                    text-align: center;
                    vertical-align: middle;
                }
                .pdf-table th {
                    background-color: #2c3e50;
                    color: white;
                    font-size: 9pt;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .col-dia {
                    background-color: #eaeded;
                    text-transform: uppercase;
                    font-size: 8pt;
                    letter-spacing: 0.5px;
                }
                .col-hora {
                    background-color: #f4f6f7;
                    font-weight: bold;
                }
                .pdf-receso {
                    background-color: #f2f4f4;
                    font-weight: bold;
                    color: #7f8c8d;
                    letter-spacing: 4px;
                    font-size: 8.5pt;
                    text-transform: uppercase;
                }
                .pdf-celda {
                    background-color: #ffffff;
                }
                .pdf-materia {
                    font-weight: bold;
                    color: #2c3e50;
                    font-size: 8.5pt;
                }
                .pdf-profesor {
                    color: #626567;
                    font-size: 7.5pt;
                    margin-top: 3px;
                    font-style: italic;
                }
                .pdf-vacio {
                    color: #bdc3c7;
                    font-size: 9pt;
                }
                
                /* Reglas específicas de impresión física */
                @media print {
                    .espacio-membrete {
                        border: none;
                        background: transparent;
                    }
                    .espacio-membrete::after {
                        display: none; /* Oculta el texto guía para que el papel salga totalmente limpio */
                    }
                    th {
                        background-color: #2c3e50 !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .col-dia {
                        background-color: #eaeded !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .pdf-receso {
                        background-color: #f2f4f4 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
            <body>
        <div id="encabezado-unico">
            <img id="logo1" class="logo-img">
            <img id="logo2" class="logo-img">
            <img id="logo3" class="logo-img">
        </div>

        <div class="titulo-reporte">Sábana General de Horarios Institucionales</div>
        ${tablaHtml}
        
            <script>
            window.onload = function() {
                // Asignamos las imágenes primero
                // Asegúrate de que las IDs sean exactamente logo1, logo2, logo3
                // Si el Base64 está dando problemas, prueba con un SRC vacío para ver si abre
                document.getElementById('logo1').src = "TU_BASE64_1";
                document.getElementById('logo2').src = "TU_BASE64_2";
                document.getElementById('logo3').src = "TU_BASE64_3";
                
                // Damos tiempo a que el navegador "vea" las imágenes
                / Ejecución y auto-cierre de la ventana de impresión

                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 300); 
            };
        </script>
    </body>
    </html>
`);
    ventanaImpresion.document.close();
}