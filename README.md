Node.js and Angular CLI installation
npm install -g @angular/cli

Clone the Repository

Install Dependencies Run this to install Angular, Material, Tailwind, and Font Awesome dependencies.

npm install

Run the Application
ng serve --open

link for localhost: http://localhost:4200/

Docker Commands 
1. docker build -t sitenov-image . # create the image 
2. docker run -d -p 8080:80 --name sitenov-app sitenov-image  #running the image 
3. docker ps #Find the ID or name of your running container
4. docker rm -f sitenov-app  #stop and remove the running container 
