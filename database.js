// --- SISTEMA DE PERSISTENCIA LOCAL (database.js) ---

const DB = {
    // ==========================================
    // 1. GESTIÓN DE MATERIAS
    // ==========================================
    
    // Obtiene la lista de materias desde el LocalStorage
    obtenerMaterias() {
        const local = localStorage.getItem('materias');
        // Si no hay nada guardado, retorna un arreglo vacío (empezamos desde cero)
        return local ? JSON.parse(local) : [];
    },

    // Agrega una nueva materia al arreglo existente y lo guarda
    guardarMateria(nuevaMateria) {
        const materias = this.obtenerMaterias();
        materias.push(nuevaMateria);
        localStorage.setItem('materias', JSON.stringify(materias));
    },

    // Filtra el arreglo para eliminar la materia seleccionada por su ID
    eliminarMateria(id) {
        let materias = this.obtenerMaterias();
        materias = materias.filter(m => m.id !== id);
        localStorage.setItem('materias', JSON.stringify(materias));
    },

    // ==========================================
    // 2. GESTIÓN DE PROFESORES
    // ==========================================
    
    // Obtiene la lista de profesores desde el LocalStorage
    obtenerProfesores() {
        const local = localStorage.getItem('profesores');
        return local ? JSON.parse(local) : [];
    },

    // Agrega un nuevo profesor con su carga asignada y lo guarda
    guardarProfesor(nuevoProfesor) {
        const profesores = this.obtenerProfesores();
        profesores.push(nuevoProfesor);
        localStorage.setItem('profesores', JSON.stringify(profesores));
    },

    // Elimina la asignación de un profesor por su ID
    eliminarProfesor(id) {
        let profesores = this.obtenerProfesores();
        profesores = profesores.filter(p => p.id !== id);
        localStorage.setItem('profesores', JSON.stringify(profesores));
    },

    // ==========================================
    // 3. GESTIÓN DE MATRIZ DE HORARIOS
    // ==========================================
    
    // Obtiene los horarios institucionales ya calculados
    obtenerHorarioGlobal() {
        const local = localStorage.getItem('horarioMatrizGlobal');
        return local ? JSON.parse(local) : {};
    },

    // Guarda el resultado final generado por el algoritmo
    guardarHorarioGlobal(nuevoHorario) {
        localStorage.setItem('horarioMatrizGlobal', JSON.stringify(nuevoHorario));
    },

    // Borra por completo la matriz de horarios de la base de datos
    vaciarHorarios() {
        localStorage.removeItem('horarioMatrizGlobal');
    }
};