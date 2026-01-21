import { Pipe, PipeTransform } from '@angular/core';

// You would likely put this formatting logic into a dedicated Angular Pipe
// to transform the plain text message into safe HTML right in the template.

@Pipe({
  name: 'formatMessage'
})
export class FormatMessagePipe implements PipeTransform {
  // Utility to escape HTML, though Angular's DomSanitizer is usually better for security
  // For simplicity, we'll use the original logic for formatting only.
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  transform(text: string): string {
    let formattedText = this.escapeHtml(text);
    
    // Convert double newlines to double <br> for paragraph breaks
    formattedText = formattedText.replace(/\n\n/g, '<br><br>');
    // Convert single newlines to single <br> for line breaks
    formattedText = formattedText.replace(/\n/g, '<br>');
    // Convert **bold** to <strong>bold</strong>
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert list markers * or - to a visual bullet point (used in the original CSS for visual effect)
    // Note: Angular might need more complex parsing for proper <ul>/<li> rendering.
    formattedText = formattedText.replace(/^\* /gm, '• ');
    formattedText = formattedText.replace(/^- /gm, '• ');
    
    // Since this is being rendered *as* HTML, you must use Angular's DomSanitizer
    // to bypass security and mark it as trusted HTML in your final implementation.
    return formattedText; 
  }
}

