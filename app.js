const btnEnvio = document.querySelector('#btnGuardar'); // ← corrección mínima

// ┌────── 1. NOMBRE DE TU BASE (cambia por el nombre de tu proyecto)
const DB_NAME = 'personas-db';   // ← MODIFICAR

// ┌────── 2. NOMBRE DE LA TABLA (cambia por tu entidad)
const STORE   = 'usuarios';           // ← MODIFICAR

// ┌────── 3. VERSIÓN: súbela en +1 si cambias estructura (columnas, índices)
const VERSION = 1;                 // ← MODIFICAR (solo cuando toques esquema, osea cuando se modifique)

// ┌────── 4. SELECTOR del <ul> / <div> donde pintarás la lista
const LISTA_SELECTOR = '#lista';   // ← corrección mínima

/* ========================================================================
   VARIABLES GLOBALES (NO TOCAR)
   ========================================================================
   db      -> conexión abierta a IndexedDB
   editId  -> id del registro que estamos editando (null = alta)
   listaEl -> elemento del DOM donde se pintan los resultados
   ======================================================================== */
let db;
let editId = null;
const listaEl = document.querySelector(LISTA_SELECTOR);

/* ========================================================================
   1. ABRIR (o crear) LA BASE DE DATOS
   ======================================================================== */
async function abrirDB() {
    db = await idb.openDB(DB_NAME, VERSION, {
        upgrade(db, oldV, newV, tx) {
            if (!db.objectStoreNames.contains(STORE)) {
                const store = db.createObjectStore(STORE, {keyPath: 'id', autoIncrement: true });
                /* OPCIONAL: crea índices para buscar más rápido
                   Ejemplo: store.createIndex('idx_nombre', 'nombre', {unique: false}); */
            }
        }
    });
}

/* ========================================================================
   2. CRUD BÁSICO (NO TOCAR SALVO NOMBRES DE FUNCIÓN si quieres)
   ======================================================================== */

/* 2.1 CREATE ------------------------------------------------------------- */
async function crearRegistro(datos) {
    const tx = db.transaction(STORE, 'readwrite');
    const id = await tx.store.add(datos); // ← inserta y devuelve el id nuevo
    await tx.done;
    return id;
}

/* 2.2 READ (todos) (Usuarios es el nombre de la tabla)-------------------- */
async function leerTodos() {
    const tx = db.transaction(STORE, 'readonly');
    const usuarios = await tx.store.getAll(); // ← array completo
    await tx.done;
    return usuarios;
}

/* 2.3 READ (uno solo) ---------------------------------------------------- */
async function leerPorId(id) {
    const tx = db.transaction(STORE, 'readonly');
    const reg = await tx.store.get(id); 
    await tx.done;
    return reg;
}

/* 2.4 UPDATE ------------------------------------------------------------- */
async function actualizarRegistro(datos) {
    const tx = db.transaction(STORE, 'readwrite');
    await tx.store.put(datos); 
    await tx.done;
}

/* 2.5 DELETE ------------------------------------------------------------- */
async function borrarRegistro(id) {
    const tx = db.transaction(STORE, 'readwrite');
    await tx.store.delete(id);
    await tx.done;
}

/* ========================================================================
   3. PINTAR LA LISTA (MODIFICAR SOLO HTML / CAMPOS)
   ======================================================================== */
async function pintarLista() {
    const usuarios = await leerTodos();
    listaEl.innerHTML = '';  // limpia viejo contenido

    usuarios.forEach(reg => {  // ← corrección mínima
        const div = document.createElement('li');
        div.textContent = `${reg.nombre || ''} – ${reg.telefono || ''} – ${reg.ciudad || ''}`;

         // 3.3 Botón EDITAR
        const btnEdit = document.createElement('button');
        btnEdit.textContent = 'Editar';
        btnEdit.onclick = () => cargarFormulario(reg);// ver sección 5

        // 3.4 Botón BORRAR
        const btn = document.createElement('button');
        btn.textContent = 'Borrar';
        btn.onclick = async () => {
            await borrarRegistro(reg.id);
            await pintarLista();// refresca
        };

        // 3.5 Añadir botones al item y item a la lista
        div.append(btnEdit, btn);
        listaEl.appendChild(div);
    });
}

/* ========================================================================
   4. MANEJO DEL FORMULARIO (MODIFICAR SELECTORES y CAMPOS)
   ======================================================================== */
const formulario = document.querySelector('#formDirectorio'); // ← corrección a formDIRE
const campos = { 
    nombre:  document.querySelector('#nombreusuario'), // ← corrección 
    telefono: document.querySelector('#numeroTel'),    // ← corrección
    ciudad:  document.querySelector('#ciudad')
};

formulario.addEventListener('submit', async e => {
    e.preventDefault();
    // 4.3 Armar objeto con los valores del form 
    const datos = {
        nombre:   campos.nombre.value.trim(),
        telefono: campos.telefono.value,
        ciudad:   campos.ciudad.value.trim()
    };
    // 4.4 Si estamos editando, añadimos el id
    if (editId) datos.id = editId;

    // 4.5 Guardar (add o put)
    editId ? await actualizarRegistro(datos)
           : await crearRegistro(datos);

    // 4.6 Resetear estado y form
    editId = null;
    btnEnvio.textContent = 'Agregar Usuario'; 
    formulario.reset();
    await pintarLista();
});

/* ========================================================================
   5. CARGAR FORMULARIO EN MODO EDICIÓN (NO TOCAR)
   ======================================================================== */
function cargarFormulario(reg) {
    editId = reg.id; 
    campos.nombre.value  = reg.nombre  || '';
    campos.telefono.value = reg.telefono || '';
    campos.ciudad.value  = reg.ciudad  || '';
    btnEnvio.textContent = 'Guardar cambios'; // feedback visual
}

/* ========================================================================
   6. ARRANCAR LA APLICACIÓN (NO TOCAR)
   ======================================================================== */
window.addEventListener('DOMContentLoaded', async () => {
    await abrirDB();
    await pintarLista();
});
