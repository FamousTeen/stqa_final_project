from locust import HttpUser, task, between

class TicketUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_events(self):
        self.client.get("/events")

    @task(2)
    def view_event_detail(self):
        self.client.get("/events/1")

    @task(1)
    def login(self):
        self.client.post("/auth/login", json={
            "email": "user@test.com",
            "password": "password123"
        })

    @task(1)
    def buy_ticket(self):
        self.client.post("/events", json={
            "event_id": 1,
            "quantity": 1
        })



# from locust import HttpUser, task, between

# class TicketUser(HttpUser):
#     wait_time = between(1, 3)

#     @task(2)
#     def open_home(self):
#         self.client.get("/")

#     @task(3)
#     def open_tickets(self):
#         self.client.get("/tickets")

#     @task(1)
#     def open_login(self):
#         self.client.get("/auth/login")