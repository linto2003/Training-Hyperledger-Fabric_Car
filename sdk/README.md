
---

### Phase 1: Setup Identities & Money

**1. Register Alice as a Dealer (Org 1)**
```bash
curl -X POST http://localhost:4000/api/identities/create \
-H "Content-Type: application/json" \
-d '{"org": "Org1", "identityName": "alice", "role": "Dealer"}'
```

**2. Register Bob as a Buyer (Org 2)**
```bash
curl -X POST http://localhost:4000/api/identities/create \
-H "Content-Type: application/json" \
-d '{"org": "Org2", "identityName": "bob", "role": "Buyer"}'
```

**3. Register Charlie as an Inspector (Org 3)**
```bash
curl -X POST http://localhost:4000/api/identities/create \
-H "Content-Type: application/json" \
-d '{"org": "Org3", "identityName": "charlie", "role": "Inspector"}'
```

**4. Register Bank Admin and Mint Money to Bob (Org 1)**
```bash
curl -X POST http://localhost:4000/api/identities/create \
-H "Content-Type: application/json" \
-d '{"org": "Org1", "identityName": "bank_admin", "role": "Admin"}'

# Initialize token system
curl -X POST http://localhost:4000/api/tokens/initialize \
-H "Content-Type: application/json" \
-d '{"user": "bank_admin", "name": "AutoCoin", "symbol": "AUTO"}'

# Give Bob 50,000 AUTO tokens
curl -X POST http://localhost:4000/api/tokens/mint \
-H "Content-Type: application/json" \
-d '{"user": "bank_admin", "account": "bob", "amount": 50000}'
```

---

### Phase 2: The Car Lifecycle
**5. Alice registers her Car**
*(The chaincode will securely verify Alice has the "Dealer" role, and make "alice" the owner)*
```bash
curl -X POST http://localhost:4000/api/vehicles/register \
-H "Content-Type: application/json" \
-d '{"user": "alice", "vehicleId": "CAR_001", "manufacturer": "Toyota", "model": "Camry", "year": 2021, "vin": "VIN123"}'
```

**6. Charlie physically Inspects it**
*(The chaincode will verify Charlie has the "Inspector" role)*
```bash
curl -X POST http://localhost:4000/api/vehicles/inspect \
-H "Content-Type: application/json" \
-d '{"user": "charlie", "vehicleId": "CAR_001", "result": "PASSED"}'
```

**7. Alice Verifies the car for sale**
*(The chaincode will verify Alice actually owns this specific car)*
```bash
curl -X POST http://localhost:4000/api/vehicles/verify \
-H "Content-Type: application/json" \
-d '{"user": "alice", "vehicleId": "CAR_001"}'
```

---

### Phase 3: The Private Deal & Settlement (PDC)
**8. Alice records a Private Deal**
*(This stores the negotiation secretly in the Private Data Collection (PDC) away from Charlie's eyes)*
```bash
curl -X POST http://localhost:4000/api/vehicles/deal \
-H "Content-Type: application/json" \
-d '{"user": "alice", "vehicleId": "CAR_001", "originalPrice": 25000, "discount": 1000, "finalPrice": 24000}'
```

**9. Bob pays Alice 24,000 Tokens**
*(Bob calls the transfer. The chaincode implicitly knows the money is coming from Bob, so you don't even need to pass a `"from"` field anymore)*
```bash
curl -X POST http://localhost:4000/api/tokens/transfer \
-H "Content-Type: application/json" \
-d '{"org": "Org2", "user": "bob", "to": "alice", "amount": 24000}'
```

**10. Alice hands over the Keys (Transfers Ownership)**
*(The chaincode verifies Alice currently owns the car, and then legally changes the owner to Bob)*
```bash
curl -X POST http://localhost:4000/api/vehicles/transfer \
-H "Content-Type: application/json" \
-d '{"org": "Org1", "user": "alice", "vehicleId": "CAR_001", "newOwner": "bob"}'
```