<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PortalEmployeeService
{
    public function syncForUser(User $user): ?User
    {
        $employee = $this->findEmployee($user);

        if (! $employee) {
            return null;
        }

        $user->forceFill($this->mapEmployee($employee))->save();

        return $user->refresh();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findEmployee(User $user): ?array
    {
        $queries = collect([
            $user->username,
            $user->email ? str($user->email)->before('@')->toString() : null,
            $user->email,
            $user->name,
        ])
            ->filter()
            ->unique()
            ->values();

        foreach ($queries as $query) {
            $employee = $this->search((string) $query);

            if ($employee) {
                return $employee;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function search(string $query): ?array
    {
        if (! config('portal.api_key')) {
            throw new RuntimeException('Portal API is not configured. Please set PORTAL_API_KEY.');
        }

        $response = $this->http()
            ->acceptJson()
            ->withHeaders([
                'Authorization' => 'Token '.config('portal.api_key'),
            ])
            ->get($this->url(config('portal.employee_search_path')), [
                'q' => $query,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Unable to fetch employee profile from Portal API.');
        }

        $results = collect($response->json('results', []));

        if ($results->isEmpty()) {
            return null;
        }

        return $results->firstWhere('username', $query)
            ?? $results->firstWhere('email', $query)
            ?? $results->first();
    }

    /**
     * @param array<string, mixed> $employee
     * @return array<string, mixed>
     */
    private function mapEmployee(array $employee): array
    {
        return [
            'employee_id' => $employee['employee_id'] ?? null,
            'id_number' => $employee['id_number'] ?? null,
            'name' => $employee['fullname'] ?? null,
            'first_name' => $employee['first_name'] ?? null,
            'middle_name' => $employee['middle_name'] ?? null,
            'last_name' => $employee['last_name'] ?? null,
            'username' => $employee['username'] ?? null,
            'contact_number' => $employee['contact'] ?? null,
            'mobile_no' => $employee['contact'] ?? null,
            'account_number' => $employee['account_number'] ?? null,
            'position' => $employee['position'] ?? null,
            'empstatus' => $employee['empstatus'] ?? null,
            'salary_rate' => $employee['salary_rate'] ?? null,
            'salary_grade' => $employee['salary_grade'] ?? null,
            'step_inc' => $employee['step_inc'] ?? null,
            'item_number' => $employee['item_number'] ?? null,
            'project' => $employee['project'] ?? null,
            'fundsource' => $employee['fundsource'] ?? null,
            'former_incumbent' => $employee['former_incumbent'] ?? null,
            'date_vacated' => $employee['date_vacated'] ?? null,
            'division' => $employee['division'] ?? null,
            'section' => $employee['section'] ?? null,
            'area_of_assignment' => $employee['area_of_assignment'] ?? null,
            'gender' => $employee['gender'] ?? null,
            'civil_status' => $employee['civil_status'] ?? null,
            'birthdate' => $employee['birthdate'] ?? null,
            'avatar' => $employee['image_path'] ?? null,
            'portal_status' => $employee['status'] ?? null,
            'email' => $employee['email'] ?? null,
            'course' => $employee['course'] ?? null,
            'address' => $employee['address'] ?? null,
            'official_email' => $employee['official_email'] ?? null,
            'is_solo_parent' => $employee['is_solo_parent'] ?? false,
            'solo_parent_details' => $employee['solo_parent_details'] ?? null,
            'is_senior_citizen' => $employee['is_senior_citizen'] ?? false,
            'is_pwd' => $employee['is_pwd'] ?? false,
            'type_of_disability' => $employee['type_of_disability'] ?? null,
            'is_indigenous' => $employee['is_indigenous'] ?? false,
            'type_of_indigenous_group' => $employee['type_of_indigenous_group'] ?? null,
            'portal_profile' => $employee,
        ];
    }

    private function http(): PendingRequest
    {
        return Http::timeout(20)->withOptions([
            'verify' => (bool) config('portal.verify_ssl'),
        ]);
    }

    private function url(string $path): string
    {
        return rtrim(config('portal.base_uri'), '/').'/'.ltrim($path, '/');
    }
}
