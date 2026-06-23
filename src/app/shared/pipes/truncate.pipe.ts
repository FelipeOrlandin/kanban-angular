import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe puro e determinístico para truncar texto.
 * Substitui getters 'shortTitle' / 'shortDescription' nos templates,
 * eliminando recriação de objetos a cada ciclo de change detection.
 */
@Pipe({
  name: 'truncate',
  standalone: true,
  pure: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength: number = 50): string {
    if (!value) return '';
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }
}
