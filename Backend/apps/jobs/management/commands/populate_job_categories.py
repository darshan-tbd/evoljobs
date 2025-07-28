"""
Management command to populate default job categories
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.jobs.models import JobCategory


class Command(BaseCommand):
    help = 'Populate default job categories'
    
    DEFAULT_CATEGORIES = [
        {
            'name': 'Software Engineer',
            'keywords': 'software engineer, developer, programmer, coding, programming, web developer, mobile developer'
        },
        {
            'name': 'Full Stack Developer',
            'keywords': 'full stack, fullstack, frontend, backend, react, angular, vue, node, django, flask'
        },
        {
            'name': 'Frontend Developer',
            'keywords': 'frontend, front-end, ui, ux, react, angular, vue, javascript, css, html'
        },
        {
            'name': 'Backend Developer',
            'keywords': 'backend, back-end, api, server, database, python, java, node, django, flask'
        },
        {
            'name': 'DevOps Engineer',
            'keywords': 'devops, deployment, ci/cd, docker, kubernetes, aws, azure, cloud, infrastructure'
        },
        {
            'name': 'Data Scientist',
            'keywords': 'data scientist, machine learning, ai, artificial intelligence, python, r, analytics'
        },
        {
            'name': 'Product Manager',
            'keywords': 'product manager, pm, product owner, product management, scrum, agile'
        },
        {
            'name': 'Designer',
            'keywords': 'designer, graphic design, ui design, ux design, photoshop, illustrator, figma'
        },
        {
            'name': 'Marketing Specialist',
            'keywords': 'marketing, digital marketing, seo, sem, social media, content marketing'
        },
        {
            'name': 'Sales Representative',
            'keywords': 'sales, sales rep, account manager, business development, customer success'
        },
        {
            'name': 'Customer Service',
            'keywords': 'customer service, support, helpdesk, customer care, client relations'
        },
        {
            'name': 'Human Resources',
            'keywords': 'hr, human resources, recruiter, recruitment, talent acquisition, people ops'
        },
        {
            'name': 'Finance & Accounting',
            'keywords': 'finance, accounting, bookkeeper, financial analyst, cfo, controller'
        },
        {
            'name': 'Legal',
            'keywords': 'lawyer, attorney, legal counsel, paralegal, compliance, contracts'
        },
        {
            'name': 'Operations Manager',
            'keywords': 'operations, ops manager, business operations, logistics, supply chain'
        },
        {
            'name': 'Project Manager',
            'keywords': 'project manager, pmp, scrum master, agile, project coordinator'
        },
        {
            'name': 'Quality Assurance',
            'keywords': 'qa, quality assurance, tester, testing, automation testing, manual testing'
        },
        {
            'name': 'Content Writer',
            'keywords': 'content writer, copywriter, technical writer, blogger, content creator'
        },
        {
            'name': 'Administrative Assistant',
            'keywords': 'admin, administrative assistant, secretary, office manager, receptionist'
        },
        {
            'name': 'Nurse',
            'keywords': 'nurse, nursing, rn, lpn, healthcare, medical, hospital, clinic'
        },
        {
            'name': 'Teacher',
            'keywords': 'teacher, educator, tutor, instructor, professor, academic, education'
        },
        {
            'name': 'Cook',
            'keywords': 'cook, chef, kitchen, culinary, restaurant, food service, catering'
        },
        {
            'name': 'Cleaner',
            'keywords': 'cleaner, janitor, housekeeping, maintenance, custodial, sanitation'
        },
        {
            'name': 'Driver',
            'keywords': 'driver, delivery, truck driver, chauffeur, transportation, logistics'
        },
        {
            'name': 'Electrician',
            'keywords': 'electrician, electrical, wiring, power, voltage, electrical engineer'
        },
        {
            'name': 'Plumber',
            'keywords': 'plumber, plumbing, pipes, water, drainage, hvac, heating'
        },
        {
            'name': 'Carpenter',
            'keywords': 'carpenter, woodworker, construction, building, renovation, contractor'
        },
        {
            'name': 'Mechanic',
            'keywords': 'mechanic, automotive, car repair, maintenance, technician, garage'
        },
        {
            'name': 'Security Guard',
            'keywords': 'security, guard, protection, surveillance, safety, patrol'
        },
        {
            'name': 'Retail Associate',
            'keywords': 'retail, sales associate, cashier, store clerk, customer service, shop'
        }
    ]
    
    def handle(self, *args, **options):
        self.stdout.write('Creating default job categories...')
        
        created_count = 0
        updated_count = 0
        
        for category_data in self.DEFAULT_CATEGORIES:
            slug = slugify(category_data['name'])
            
            category, created = JobCategory.objects.get_or_create(
                name=category_data['name'],
                defaults={
                    'slug': slug,
                    'keywords': category_data['keywords'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                # Update keywords if category exists
                if category.keywords != category_data['keywords']:
                    category.keywords = category_data['keywords']
                    category.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'Updated category: {category.name}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {len(self.DEFAULT_CATEGORIES)} categories: '
                f'{created_count} created, {updated_count} updated'
            )
        ) 