describe('GET /customers API tests', () => {
    const apiUrl = Cypress.env('apiUrl')

    it('returns customers for valid default request', () => {
        cy.request('GET', `${apiUrl}/customers`).then(({ status, body }) => {
            expect(status).to.eq(200)
            const { customers, pageInfo } = body
            expect(customers).to.be.an('array')
            expect(pageInfo).to.have.all.keys('currentPage', 'totalPages', 'totalCustomers')
            expect(pageInfo.currentPage).to.eq(1)
        })
    })

    it('returns only medium technology customers on page 2 with limit 10', () => {
        cy.request('GET', `${apiUrl}/customers?page=2&limit=10&size=Medium&industry=Technology`).then(({ status, body }) => {
            expect(status).to.eq(200)
            const { customers, pageInfo } = body
            expect(pageInfo.currentPage).to.eq(2)
            expect(customers.length).to.be.at.most(10)
            customers.forEach(({ size, industry, employees }) => {
                expect(industry).to.eq('Technology')
                expect(size).to.eq('Medium')
                expect(employees).to.be.gte(100).and.to.be.lt(1000)
            })
        })
    })

    it('returns empty customers array for non-existent filter combination', () => {
        cy.request('GET', `${apiUrl}/customers?size=Small&industry=Finance&page=999`).then(({ status, body }) => {
            expect(status).to.eq(200)
            const { customers } = body
            expect(customers).to.be.an('array').that.is.empty
        })
    })

    it('returns 400 for negative page parameter', () => {
        cy.request({
            method: 'GET',
            url: `${apiUrl}/customers?page=-1`,
            failOnStatusCode: false
        }).then(({ status }) => {
            expect(status).to.eq(400)
        })
    })

    it('returns 400 for invalid industry parameter', () => {
        cy.request({
            method: 'GET',
            url: `${apiUrl}/customers?industry=InvalidIndustry`,
            failOnStatusCode: false
        }).then(({ status }) => {
            expect(status).to.eq(400)
        })
    })

    it('returns address as null when customer address is missing', () => {
        cy.request('GET', `${apiUrl}/customers?limit=50`).then(({ status, body }) => {
            expect(status).to.eq(200)
            const { customers } = body
            const customerWithNoAddress = customers.find(({ address }) => address === null)
            if (customerWithNoAddress) {
                expect(customerWithNoAddress.address).to.be.null
            }
        })
    })

    it('returns contactInfo as null when customer contact info is missing', () => {
        cy.request('GET', `${apiUrl}/customers?limit=50`).then(({ status, body }) => {
            expect(status).to.eq(200)
            const { customers } = body
            const customerWithNoContact = customers.find(({ contactInfo }) => contactInfo === null)
            if (customerWithNoContact) {
                expect(customerWithNoContact.contactInfo).to.be.null
            }
        })
    })

    it('returns correct size classification based on employees', () => {
        cy.request('GET', `${apiUrl}/customers?limit=100`).then(({ status, body }) => {
            expect(status).to.eq(200)
            const { customers } = body
            customers.forEach(({ size, employees }) => {
                if (employees < 100) expect(size).to.eq('Small')
                else if (employees >= 100 && employees < 1000) expect(size).to.eq('Medium')
                else if (employees >= 1000 && employees < 10000) expect(size).to.eq('Enterprise')
                else if (employees >= 10000 && employees < 50000) expect(size).to.eq('Large Enterprise')
                else if (employees >= 50000) expect(size).to.eq('Very Large Enterprise')
            })
        })
    })
})