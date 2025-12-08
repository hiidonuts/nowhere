import { io, Socket } from 'socket.io-client';
import { SocketData } from '../types';

class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    // For demo purposes, using a mock socket
    this.socket = {
      emit: (event: string, data: any) => {
        console.log('Socket emit:', event, data);
      },
      on: (event: string, callback: (data: any) => void) => {
        console.log('Socket on:', event);
        // Mock real-time location updates
        if (event === 'newLocation') {
          setTimeout(() => {
            callback({ lat: Math.random() * 180 - 90, lng: Math.random() * 360 - 180 });
          }, 1000);
        }
      },
      disconnect: () => {
        console.log('Socket disconnected');
      },
    } as any;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: SocketData): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }
}

export const socketService = new SocketService();