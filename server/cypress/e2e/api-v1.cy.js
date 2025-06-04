/// <reference types="cypress" />

describe('GET /customers API', () => {
  const apiUrl = 'http://localhost:3001/customers';

  it('should return 200 and correct structure for default request', () => {
    cy.request(apiUrl).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('customers').and.to.be.an('array').and.to.have.length(10)
      expect(response.body).to.have.property('pageInfo');
      expect(response.body.pageInfo).to.have.all.keys('currentPage', 'totalPages', 'totalCustomers');
    });
  });

  it('should respect "page" and "limit" query parameters', () => {
    cy.request(`${apiUrl}?page=2&limit=5`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.pageInfo.currentPage).to.eq(2);
      expect(response.body.customers.length).to.be.at.most(5);
    });
  });

  it('should filter customers by "size" and "industry"', () => {
    cy.request(`${apiUrl}?size=Medium&industry=Technology`).then((response) => {
      expect(response.status).to.eq(200);
      response.body.customers.forEach((customer) => {
        expect(customer.size).to.eq('Medium');
        expect(customer.industry).to.eq('Technology');
      });
    });
  });

  it('should apply default values when parameters are omitted', () => {
    cy.request(apiUrl).then((defaultResp) => {
      cy.request(`${apiUrl}?page=1&limit=10&size=All&industry=All`).then((explicitResp) => {
        expect(defaultResp.body).to.deep.equal(explicitResp.body);
      });
    });
  });

  it('should set correct "size" based on number of employees', () => {
    cy.request(`${apiUrl}?limit=20`).then((response) => {
      expect(response.status).to.eq(200);
      response.body.customers.forEach((customer) => {
        if (typeof customer.employees === 'number') {
          const emp = customer.employees;
          let expectedSize;
          if (emp < 100) expectedSize = 'Small';
          else if (emp < 1000) expectedSize = 'Medium';
          else if (emp < 10000) expectedSize = 'Enterprise';
          else if (emp < 50000) expectedSize = 'Large Enterprise';
          else expectedSize = 'Very Large Enterprise';
          expect(customer.size).to.eq(expectedSize);
        }
      });
    });
  });

  it('should allow filtering by all valid sizes', () => {
    const sizes = ['Small', 'Medium', 'Enterprise', 'Large Enterprise', 'Very Large Enterprise'];
    sizes.forEach((size) => {
      cy.request(`${apiUrl}?size=${encodeURIComponent(size)}`).then((response) => {
        expect(response.status).to.eq(200);
        response.body.customers.forEach((customer) => {
          expect(customer.size).to.eq(size);
        });
      });
    });
  });

  it('should allow filtering by all valid industries', () => {
    const industries = ['Logistics', 'Retail', 'Technology', 'HR', 'Finance'];
    industries.forEach((industry) => {
      cy.request(`${apiUrl}?industry=${encodeURIComponent(industry)}`).then((response) => {
        expect(response.status).to.eq(200);
        response.body.customers.forEach((customer) => {
          expect(customer.industry).to.eq(industry);
        });
      });
    });
  });

  it('should handle customers with null contactInfo or address', () => {
    cy.request(`${apiUrl}?limit=20`).then((response) => {
      expect(response.status).to.eq(200);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      response.body.customers.forEach((customer) => {
        // 🔸 Verifica que a propriedade contactInfo existe (pode ser null)
        expect(customer).to.have.property('contactInfo');

        if (customer.contactInfo === null) {
          // ✅ Caso não tenha dados, deve ser exatamente null
          expect(customer.contactInfo).to.be.null;
        } else {
          // ✅ Caso tenha dados, deve ser um objeto com name e email válidos
          expect(customer.contactInfo).to.be.an('object');
          expect(customer.contactInfo.name).to.be.a('string').and.not.be.empty;
          expect(customer.contactInfo.email).to.be.a('string').and.match(emailRegex);
        }

        // 🔸 Verifica que a propriedade address existe (pode ser null)
        expect(customer).to.have.property('address');

        if (customer.address === null) {
          // ✅ Caso não tenha dados, deve ser exatamente null
          expect(customer.address).to.be.null;
        } else {
          // ✅ Caso tenha dados, deve ser um objeto com todos os campos preenchidos
          expect(customer.address).to.be.an('object');
          expect(customer.address.street).to.be.a('string').and.not.be.empty;
          expect(customer.address.city).to.be.a('string').and.not.be.empty;
          expect(customer.address.state).to.be.a('string').and.not.be.empty;
          expect(customer.address.zipCode).to.be.a('string').and.not.be.empty;
          expect(customer.address.country).to.be.a('string').and.not.be.empty;
        }
      });
    });
  });


  it('should return 400 for negative or non-number page/limit', () => {
    cy.request({
      url: `${apiUrl}?page=-1`,
      failOnStatusCode: false
    }).its('status').should('eq', 400);

    cy.request({
      url: `${apiUrl}?limit=abc`,
      failOnStatusCode: false
    }).its('status').should('eq', 400);
  });

  it('should return 400 for unsupported size or industry', () => {
    cy.request({
      url: `${apiUrl}?size=Gigantic`,
      failOnStatusCode: false
    }).its('status').should('eq', 400);

    cy.request({
      url: `${apiUrl}?industry=UnknownIndustry`,
      failOnStatusCode: false
    }).its('status').should('eq', 400);
  });
});