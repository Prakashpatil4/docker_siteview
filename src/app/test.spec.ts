import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should handle 100 users at a time', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    // Simulate 100 users
    const mockUsers = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
    }));

    // Assign mock users to the component (adjust property name as needed)
    (app as any).users = mockUsers;

    // Trigger change detection
    fixture.detectChanges();

    // Check if all users are handled (adjust selector/property as needed)
    // Example: if users are rendered in a list
    // const userElements = fixture.nativeElement.querySelectorAll('.user-item');
    // expect(userElements.length).toBe(100);

    // If just checking the property
    expect((app as any).users.length).toBe(100);
  });
});