import Dexie from 'dexie';

export const db = new Dexie('AttendanceOfflineDB');

// Schema definition
db.version(1).stores({
    divisions: 'id, anio, seccion',             // Cache for all divisions
    assignments: 'id, materia_name, division_name', // Cache for assignments
    students: 'id, assignment_id, division_id, nombre, dni',   // Cache for students per assignment or division
    attendance_queue: '++id, estudiante_id, asignacion_id, division_id, fecha, estado, observaciones, synced, type' // Queue for pending syncs
});

export const saveDivisionsToLocal = async (divisions) => {
    await db.divisions.clear();
    await db.divisions.bulkPut(divisions);
};

export const saveAssignmentsToLocal = async (assignments) => {
    await db.assignments.clear();
    const toSave = assignments.map(a => ({
        id: a.id,
        materia_name: a.materia.nombre,
        division_id: a.division.id,
        division_name: `${a.division.anio} "${a.division.seccion}"`
    }));
    await db.assignments.bulkPut(toSave);
};

export const saveStudentsToLocal = async (assignmentId, students) => {
    // Delete existing students for this assignment before putting new ones
    await db.students.where('assignment_id').equals(assignmentId).delete();
    const toSave = students.map(s => ({
        ...s,
        assignment_id: assignmentId
    }));
    await db.students.bulkPut(toSave);
};

export const saveGeneralStudentsToLocal = async (divisionId, students) => {
    await db.students.where('division_id').equals(divisionId).delete();
    const toSave = students.map(s => ({
        ...s,
        division_id: divisionId
    }));
    await db.students.bulkPut(toSave);
};

export const addToSyncQueue = async (records, type = 'assignment') => {
    const toQueue = records.map(r => ({
        ...r,
        synced: 0,
        type
    }));
    await db.attendance_queue.bulkPut(toQueue);
};

export const getPendingSyncs = async () => {
    return await db.attendance_queue.where('synced').equals(0).toArray();
};

export const markAsSynced = async (ids) => {
    await db.attendance_queue.bulkDelete(ids);
};

export const syncAllPending = async (supabase) => {
    if (!navigator.onLine) return { success: false, error: 'No connection' };

    const pending = await getPendingSyncs();
    if (pending.length === 0) return { success: true, count: 0 };

    const assignmentRecords = pending
        .filter(p => p.type === 'assignment')
        .map(({ id, synced, type, ...record }) => ({
            estudiante_id: record.estudiante_id,
            asignacion_id: record.asignacion_id,
            fecha: record.fecha,
            estado: record.estado,
            observaciones: record.observaciones
        }));

    const generalRecords = pending
        .filter(p => p.type === 'general')
        .map(({ id, synced, type, ...record }) => ({
            estudiante_id: record.estudiante_id,
            division_id: record.division_id,
            fecha: record.fecha,
            estado: record.estado,
            observaciones: record.observaciones
        }));

    try {
        if (assignmentRecords.length > 0) {
            const { error } = await supabase.from('asistencias').upsert(assignmentRecords, { onConflict: 'estudiante_id, asignacion_id, fecha' });
            if (error) throw error;
        }

        if (generalRecords.length > 0) {
            // Filter out any assignment_id if it exists in the record for general sync
            const { error } = await supabase.from('asistencias_preceptor').upsert(generalRecords, { onConflict: 'estudiante_id, division_id, fecha' });
            if (error) throw error;
        }

        await markAsSynced(pending.map(p => p.id));
        return { success: true, count: pending.length };
    } catch (error) {
        console.error('Core sync error:', error);
        return { success: false, error };
    }
};
