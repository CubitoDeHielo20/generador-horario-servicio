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
    if (confirm("¿Seguro de limpiar la cuadrícula completa?")) { DB.vaciarHorarios(); actualizarTablaHorarioVisual(); }
}

function procesarMotorHorarios() {
    let nuevoHorarioGlobal = {};
    const profesores = DB.obtenerProfesores();
    let poolCargaProfesores = profesores.map(p => ({ ...p, bloquesRestantes: Math.floor(p.horasCarga / 2) }));
    const mezclar = (array) => { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; };

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
                        !profesoresOcupadosAhora.includes(p.nombre) && !materiasHoy.includes(p.materia)
                    );

                    if (asignacionValida) {
                        const idx = poolCargaProfesores.findIndex(prof => prof.id === asignacionValida.id);
                        poolCargaProfesores[idx].bloquesRestantes--;
                        profesoresOcupadosAhora.push(asignacionValida.nombre);
                        nuevoHorarioGlobal[cursoKey][dia][par.h1] = { materia: asignacionValida.materia, profesor: asignacionValida.nombre };
                        nuevoHorarioGlobal[cursoKey][dia][par.h2] = { materia: asignacionValida.materia, profesor: asignacionValida.nombre };
                    }
                });
            });
        });
    });
    DB.guardarHorarioGlobal(nuevoHorarioGlobal);
    mostrarNotificacion("¡Horario Generado!", "success");
    actualizarTablaHorarioVisual();
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