import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    // role: ['Technical Troubleshooting Agent'],
    password: ['', [Validators.required]]
  });

  errorMessage = '';
  
  // 1. ADD THIS VARIABLE
  isLoading = false; 

  onSubmit() {
    console.log('1. Button Clicked'); // <--- Log 1

    if (this.loginForm.invalid) {
      console.log('2. Form is invalid', this.loginForm.errors); // <--- Log 2
      return;
    }

    console.log('3. Form is valid, sending data...'); // <--- Log 3
    this.isLoading = true; 
    this.errorMessage = ''; 

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('4. Login Success! Attempting navigation...'); // <--- Log 4
        this.isLoading = false; 
        
        // This is the critical line
        this.router.navigate(['/dashboard']).then(success => {
          console.log('5. Navigation result:', success); // <--- Log 5
        }); 
      },
      error: (err) => {
        console.error('4. Login Failed:', err); // <--- Log Error
        this.isLoading = false; 
        // this.errorMessage = 'Invalid Credentials or Role';

        this.errorMessage = err.message || 'An unknown error occurred';
      }
    });
  }
}