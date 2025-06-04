/// <reference types="cypress" />

const apiUrl = Cypress.env('apiUrl')

// Utilitário para verificar se um cliente é do tipo Medium
const isMediumCustomer = ({ employees }) => employees >= 100 && employees < 1000

describe('GET /customers', () => {
  context('Requisição bem-sucedida com query strings padrão', () => {
    it('retorna status 200 e estrutura de resposta válida', () => {
      // Arrange

      // Act
      cy.request('GET', `${apiUrl}/customers`).then(response => {
        // Assert
        const { status, body } = response
        expect(status).to.eq(200)

        const { customers, pageInfo } = body

        expect(customers).to.be.an('array')
        customers.forEach(customer => {
          const {
            id,
            name,
            employees,
            industry,
            contactInfo,
            address,
            size
          } = customer

          expect(id).to.be.a('number')
          expect(name).to.be.a('string')
          expect(employees).to.be.a('number')
          expect(industry).to.be.a('string')
          // contactInfo pode ser null ou objeto
          if (contactInfo !== null) {
            expect(contactInfo).to.have.all.keys('name', 'email')
            expect(contactInfo.name).to.be.a('string')
            expect(contactInfo.email).to.be.a('string')
          }
          // address pode ser null ou objeto
          if (address !== null) {
            expect(address).to.have.all.keys(
              'street',
              'city',
              'state',
              'zipCode',
              'country'
            )
            Object.values(address).forEach(value => expect(value).to.be.a('string'))
          }
          expect(size).to.be.oneOf([
            'Small',
            'Medium',
            'Enterprise',
            'Large Enterprise',
            'Very Large Enterprise'
          ])
        })

        expect(pageInfo).to.have.all.keys(
          'currentPage',
          'totalPages',
          'totalCustomers'
        )
        expect(pageInfo.currentPage).to.be.a('number')
        expect(pageInfo.totalPages).to.be.a('number')
        expect(pageInfo.totalCustomers).to.be.a('number')
      })
    })
  })

  context('Paginação', () => {
    it('retorna clientes da página 2', () => {
      // Arrange

      // Act
      cy.request('GET', `${apiUrl}/customers?page=2`).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(200)
        const { pageInfo } = body
        expect(pageInfo.currentPage).to.eq(2)
      })
    })

    it('retorna erro ao passar page igual a 0', () => {
      // Arrange

      // Act
      cy.request({
        method: 'GET',
        url: `${apiUrl}/customers?page=0`,
        failOnStatusCode: false
      }).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(400)
        const { error } = body
        expect(error).to.match(/Invalid page or limit/)
      })
    })

    it('retorna erro ao passar page igual a -1', () => {
      // Arrange

      // Act
      cy.request({
        method: 'GET',
        url: `${apiUrl}/customers?page=-1`,
        failOnStatusCode: false
      }).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(400)
        const { error } = body
        expect(error).to.match(/Invalid page or limit/)
      })
    })
  })

  context('Limite de resultados', () => {
    it('retorna a quantidade correta de clientes ao usar limit=5', () => {
      // Arrange

      // Act
      cy.request('GET', `${apiUrl}/customers?limit=5`).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(200)
        const { customers } = body
        expect(customers).to.have.length.of.at.most(5)
      })
    })

    it('retorna erro ao passar limit igual a 0', () => {
      // Arrange

      // Act
      cy.request({
        method: 'GET',
        url: `${apiUrl}/customers?limit=0`,
        failOnStatusCode: false
      }).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(400)
        const { error } = body
        expect(error).to.match(/Invalid page or limit/)
      })
    })

    it('retorna erro ao passar limit igual a -1', () => {
      // Arrange

      // Act
      cy.request({
        method: 'GET',
        url: `${apiUrl}/customers?limit=-1`,
        failOnStatusCode: false
      }).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(400)
        const { error } = body
        expect(error).to.match(/Invalid page or limit/)
      })
    })
  })

  context('Filtragem por tamanho', () => {
    it('retorna apenas clientes Medium ao filtrar por size=Medium', () => {
      // Arrange

      // Act
      cy.request('GET', `${apiUrl}/customers?size=Medium`).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(200)
        const { customers } = body
        customers.forEach(({ size, employees }) => {
          expect(size).to.eq('Medium')
          expect(isMediumCustomer({ employees })).to.be.true
        })
      })
    })

    it('retorna erro ao passar size inválido', () => {
      // Arrange

      // Act
      cy.request({
        method: 'GET',
        url: `${apiUrl}/customers?size=Gigantic`,
        failOnStatusCode: false
      }).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(400)
        const { error } = body
        expect(error).to.match(/Unsupported size value/)
      })
    })
  })

  context('Filtragem por indústria', () => {
    it('retorna apenas clientes do setor Technology ao filtrar por industry=Technology', () => {
      // Arrange

      // Act
      cy.request('GET', `${apiUrl}/customers?industry=Technology`).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(200)
        const { customers } = body
        customers.forEach(({ industry }) => {
          expect(industry).to.eq('Technology')
        })
      })
    })

    it('retorna erro ao passar industry inválido', () => {
      // Arrange

      // Act
      cy.request({
        method: 'GET',
        url: `${apiUrl}/customers?industry=Food`,
        failOnStatusCode: false
      }).then(({ status, body }) => {
        // Assert
        expect(status).to.eq(400)
        const { error } = body
        expect(error).to.match(/Unsupported industry value/)
      })
    })
  })
})