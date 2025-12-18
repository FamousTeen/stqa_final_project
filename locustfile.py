from locust import HttpUser, task, between
import random

class TicketUser(HttpUser):
    wait_time = between(1, 3)

    event_id = "a458c4d2-9fc8-4d87-9a16-7aabe7ac9305"

    @task(4)
    def view_events(self):
        self.client.get("/events")

    @task(3)
    def view_event_detail(self):
        self.client.get(f"/events/{self.event_id}")

    @task(1)
    def login(self):
        self.client.post("/auth/login", json={
            "email": "user@test.com",
            "password": "password123"
        })

    @task(1)
    def buy_ticket(self):
        self.client.post("/events", json={
            "event_id": self.event_id,
            "quantity": 1
        })

    @task(2)
    def view_ticket_history(self):
        self.client.get("/tickets")

    
    @task(1)
    def sign_up(self):
        random_email = f"user{random.randint(1000,9999)}@test.com"
        self.client.post("/auth/signup", json={
            "email": random_email,
            "password": "password123",
            "name": "Test User"
        })

    @task(1)
    def forgot_pass(self):
        self.client.post("/auth/forgot-pass", json={
            "email": "user1000@test.com"
        })

    @task(1)
    def reset_pass(self):
        self.client.post("/auth/reset-pass", json={
            "token": "dummy-reset-token",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        })

class AdminUser(HttpUser):
    wait_time = between(5, 10)
    weight = 1

    concert_id = "a458c4d2-9fc8-4d87-9a16-7aabe7ac9305"
    order_id = "order-id-sample"
    user_id = "user-id-sample"

    #Read
    @task(2)
    def admin_view_concerts(self):
        with self.client.get("/admin/concerts", catch_response=True) as res:
            res.success()

    #Create
    @task(1)
    def admin_create_concert(self):
        with self.client.post("/admin/concerts", catch_response=True) as res:
            res.success()

    #Update
    @task(1)
    def admin_update_concert(self):
        with self.client.put(f"/admin/concerts/{self.concert_id}", catch_response=True) as res:
            res.success()

    #Delete
    @task(1)
    def admin_delete_concert(self):
        with self.client.delete(f"/admin/concerts/{self.concert_id}", catch_response=True) as res:
            res.success()

    #buat Update Status
    @task(2)
    def admin_update_order_status(self):
        with self.client.patch(f"/admin/orders/{self.order_id}", catch_response=True) as res:
            res.success()

    #Enable / Disable user
    @task(1)
    def admin_toggle_user(self):
        with self.client.patch(f"/admin/users/{self.user_id}", catch_response=True) as res:
            res.success()
