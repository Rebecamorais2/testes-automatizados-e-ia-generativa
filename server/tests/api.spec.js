// Playwright test suite for /customers API endpoint

const { test, expect } = require('@playwright/test')

const apiUrl = process.env.API_URL || 'http://localhost:3001'

// Utilitário para verificar se um cliente é do tipo Medium
const isMediumCustomer = ({ employees }) => employees >= 100 && employees < 1000

test.describe('GET /customers', () => {
  test.describe('Requisição bem-sucedida com query strings padrão', () => {
    test('retorna status 200 e estrutura de resposta válida', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(200)
      const { customers, pageInfo } = body

      expect(Array.isArray(customers)).toBe(true)
      for (const customer of customers) {
        const {
          id,
          name,
          employees,
          industry,
          contactInfo,
          address,
          size
        } = customer

        expect(typeof id).toBe('number')
        expect(typeof name).toBe('string')
        expect(typeof employees).toBe('number')
        expect(typeof industry).toBe('string')
        if (contactInfo !== null) {
          expect(typeof contactInfo.name).toBe('string')
          expect(typeof contactInfo.email).toBe('string')
        }
        if (address !== null) {
          expect(typeof address.street).toBe('string')
          expect(typeof address.city).toBe('string')
          expect(typeof address.state).toBe('string')
          expect(typeof address.zipCode).toBe('string')
          expect(typeof address.country).toBe('string')
        }
        expect([
          'Small',
          'Medium',
          'Enterprise',
          'Large Enterprise',
          'Very Large Enterprise'
        ]).toContain(size)
      }

      expect(typeof pageInfo.currentPage).toBe('number')
      expect(typeof pageInfo.totalPages).toBe('number')
      expect(typeof pageInfo.totalCustomers).toBe('number')
    })
  })

  test.describe('Paginação', () => {
    test('retorna clientes da página 2', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?page=2`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(200)
      expect(body.pageInfo.currentPage).toBe(2)
    })

    test('retorna erro ao passar page igual a 0', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?page=0`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(400)
      expect(body.error).toMatch(/Invalid page or limit/)
    })

    test('retorna erro ao passar page igual a -1', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?page=-1`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(400)
      expect(body.error).toMatch(/Invalid page or limit/)
    })
  })

  test.describe('Limite de resultados', () => {
    test('retorna a quantidade correta de clientes ao usar limit=5', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?limit=5`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(200)
      expect(body.customers.length).toBeLessThanOrEqual(5)
    })

    test('retorna erro ao passar limit igual a 0', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?limit=0`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(400)
      expect(body.error).toMatch(/Invalid page or limit/)
    })

    test('retorna erro ao passar limit igual a -1', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?limit=-1`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(400)
      expect(body.error).toMatch(/Invalid page or limit/)
    })
  })

  test.describe('Filtragem por tamanho', () => {
    test('retorna apenas clientes Medium ao filtrar por size=Medium', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?size=Medium`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(200)
      for (const { size, employees } of body.customers) {
        expect(size).toBe('Medium')
        expect(isMediumCustomer({ employees })).toBe(true)
      }
    })

    test('retorna erro ao passar size inválido', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?size=Gigantic`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(400)
      expect(body.error).toMatch(/Unsupported size value/)
    })
  })

  test.describe('Filtragem por indústria', () => {
    test('retorna apenas clientes do setor Technology ao filtrar por industry=Technology', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?industry=Technology`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(200)
      for (const { industry } of body.customers) {
        expect(industry).toBe('Technology')
      }
    })

    test('retorna erro ao passar industry inválido', async ({ request }) => {
      // Arrange

      // Act
      const response = await request.get(`${apiUrl}/customers?industry=Food`)
      const body = await response.json()

      // Assert
      expect(response.status()).toBe(400)
      expect(body.error).toMatch(/Unsupported industry value/)
    })
  })
})