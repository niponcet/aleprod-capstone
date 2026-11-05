import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { supabase } from '../api/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from './ConfirmModal';
import { triggerHaptic } from '../utils/haptics';
import {
  getActiveLocalEvento,
  setActiveLocalEvento,
  LocalEvento,
} from '../db/database';

interface EventPayload {
  evento_id: string;
  nombre_evento: string;
}

/**
 * Componente global que intercepta notificaciones push de inicio de evento (Foreground y Background/Tap).
 * Implementa la lógica de unión (Event Joiner) con confirmación mediante ConfirmModal,
 * gestión de conflictos contra SQLite y validación en tiempo real contra Supabase Cloud.
 */
export const EventNotificationJoiner: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [pendingEvent, setPendingEvent] = useState<EventPayload | null>(null);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [isConflict, setIsConflict] = useState<boolean>(false);

  // Evitar procesar el mismo evento duplicado en ráfaga
  const lastProcessedIdRef = useRef<string | null>(null);

  /**
   * Extrae y procesa los datos del payload de la notificación.
   */
  const processEventPayload = useCallback(
    (data: any, isFromTap: boolean) => {
      if (!data) return;

      const eventoId: string | undefined =
        data.evento_id || data.eventoId || data.id;
      const nombreEvento: string =
        data.nombre_evento ||
        data.nombreEvento ||
        data.nombre ||
        'Producción Técnica';

      if (!eventoId) {
        // La notificación no corresponde a un evento
        return;
      }

      // Si ya está abierto el modal para el mismo evento, no duplicar
      if (modalVisible && pendingEvent?.evento_id === eventoId) {
        return;
      }

      // Evitar reactivaciones repetidas de la misma notificación en < 3 segundos
      if (lastProcessedIdRef.current === eventoId && !isFromTap) {
        return;
      }
      lastProcessedIdRef.current = eventoId;

      triggerHaptic('warning');

      // 1. Revisar estado actual en SQLite local
      const currentActive = getActiveLocalEvento();

      if (currentActive && currentActive.id === eventoId) {
        // Ya está unido a este evento exacto
        showToast({
          type: 'info',
          title: 'EVENTO ACTIVO',
          message: `Ya te encuentras participando en "${nombreEvento}".`,
          code: eventoId,
        });
        return;
      }

      if (currentActive && currentActive.id !== eventoId) {
        // Caso Borde: Conflicto con otro evento local activo
        setIsConflict(true);
        setModalMessage(
          `Actualmente tienes un evento activo ("${
            currentActive.nombre || 'Montaje Anterior'
          }"). ¿Deseas abandonarlo y unirte a "${nombreEvento}"?`
        );
      } else {
        // Caso Estándar: Sin evento previo activo
        setIsConflict(false);
        setModalMessage(
          `El Coordinador ha iniciado el montaje de "${nombreEvento}". ¿Deseas unirte para reportar incidencias bajo esta producción?`
        );
      }

      setPendingEvent({ evento_id: eventoId, nombre_evento: nombreEvento });
      setModalVisible(true);
    },
    [modalVisible, pendingEvent, showToast]
  );

  useEffect(() => {
    // 1. Listener en Primer Plano (Foreground):
    // La app está abierta. No suena nativamente pero intercepta el evento y levanta el modal.
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        console.log('[EventJoiner] Push recibido en Foreground:', data);
        processEventPayload(data, false);
      }
    );

    // 2. Listener en Segundo Plano / Tap (Background):
    // El técnico presiona la notificación en la barra de estado o centro de notificaciones.
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('[EventJoiner] Push pulsado por usuario (Response):', data);
        processEventPayload(data, true);
      }
    );

    // 3. Revisar si la aplicación se abrió desde una notificación en arranque en frío (Cold Boot)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        console.log('[EventJoiner] App iniciada desde push (Cold Start):', data);
        processEventPayload(data, true);
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [processEventPayload]);

  /**
   * Confirma la unión al evento con validación Realtime y guardado en SQLite.
   */
  const handleConfirmJoin = async () => {
    if (!pendingEvent) return;

    setConfirmLoading(true);
    const targetId = pendingEvent.evento_id;

    try {
      // 1. Validación Realtime contra Supabase Cloud
      const { data: remoteEvent, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (error || !remoteEvent || remoteEvent.estado !== 'en_curso') {
        setConfirmLoading(false);
        setModalVisible(false);
        setPendingEvent(null);
        triggerHaptic('error');
        showToast({
          type: 'warning',
          title: 'EVENTO NO DISPONIBLE',
          message: 'El evento ya no se encuentra en curso.',
          code: targetId,
        });
        return;
      }

      // 2. Configurar entorno local SQLite:
      // Pasa cualquier evento anterior a 'planificado' y activa el nuevo evento.
      const localToSave: LocalEvento = {
        id: remoteEvent.id,
        nombre: remoteEvent.nombre,
        locacion: remoteEvent.locacion || 'Recinto no especificado',
        fecha_inicio: remoteEvent.fecha_inicio || new Date().toISOString(),
        fecha_termino: remoteEvent.fecha_termino || null,
        estado: 'en_curso',
        metros_cuadrados: Number(remoteEvent.metros_cuadrados) || 0,
        tipo_pantalla: remoteEvent.tipo_pantalla || 'Pista de Baile LED',
        tecnico_id: remoteEvent.tecnico_id || user?.id,
      };

      setActiveLocalEvento(localToSave);

      setConfirmLoading(false);
      setModalVisible(false);
      setPendingEvent(null);
      triggerHaptic('success');

      showToast({
        type: 'success',
        title: 'UNIDO AL EVENTO',
        message: `Te has unido exitosamente al montaje "${remoteEvent.nombre}".`,
        code: remoteEvent.id,
      });
    } catch (err: any) {
      console.error('[EventJoiner] Error al unirse al evento:', err);
      setConfirmLoading(false);
      setModalVisible(false);
      setPendingEvent(null);
      showToast({
        type: 'error',
        title: 'ERROR DE CONEXIÓN',
        message: err?.message || 'No se pudo verificar el estado del evento.',
        code: targetId,
      });
    }
  };

  const handleCancelJoin = () => {
    triggerHaptic('light');
    setModalVisible(false);
    setPendingEvent(null);
  };

  return (
    <ConfirmModal
      visible={modalVisible}
      title={isConflict ? 'Cambio de Evento Activo' : 'Iniciar Montaje'}
      message={modalMessage}
      confirmText="Unirse"
      cancelText="Ignorar"
      isDestructive={isConflict}
      confirmLoading={confirmLoading}
      onConfirm={handleConfirmJoin}
      onCancel={handleCancelJoin}
    />
  );
};

